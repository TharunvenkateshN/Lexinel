"""
Lexinel AML Agent — Graph Nodes
Each function is one node in the LangGraph. They receive state, do work, 
and return a dict of state keys to update.
"""

import json
import asyncio
from datetime import datetime, timezone

from services.storage import policy_db
from services.gemini import GeminiService
from services.policy_engine import policy_engine
from .state import LexinelState

gemini = GeminiService()


# ──────────────────────────────────────────────────────────────────────────────
# NODE 1 — SAFETY GUARD
# First line of defence: PII scrubbing, keyword injection, policy rules
# ──────────────────────────────────────────────────────────────────────────────
async def safety_guard_node(state: LexinelState) -> dict:
    """
    Runs the deterministic PolicyGuard engine.
    Hard-blocks prompts that violate immutable compliance rules.
    """
    log_entry = f"[{_ts()}] SAFETY_GUARD: Evaluating input for agent_id={state['agent_id']}"
    print(log_entry)

    try:
        is_blocked, processed, metadata = await asyncio.to_thread(
            policy_engine.evaluate_prompt,
            state["message"],
            state["agent_id"]
        )
        return {
            "is_blocked": is_blocked,
            "block_reason": metadata.get("reason", ""),
            "message": processed,           # may be redacted
            "step_log": [log_entry + f" → blocked={is_blocked}"]
        }
    except Exception as e:
        return {
            "is_blocked": False,
            "block_reason": "",
            "step_log": [f"[{_ts()}] SAFETY_GUARD_ERROR: {e}"]
        }


# ──────────────────────────────────────────────────────────────────────────────
# NODE 2 — POLICY RAG
# Retrieves the top-K most relevant policy chunks from the vector store
# ──────────────────────────────────────────────────────────────────────────────
async def policy_rag_node(state: LexinelState) -> dict:
    """
    Creates an embedding of the input and performs cosine-similarity search
    against the policy vector store to pull the most relevant regulation text.
    """
    log_entry = f"[{_ts()}] POLICY_RAG: Fetching relevant policy context"
    print(log_entry)

    try:
        query_vec = await gemini.create_embedding(state["message"])
        chunks = await asyncio.to_thread(
            policy_db.search_relevant_policies, query_vec, top_k=5
        )
        context = [c["chunk_text"] for c in chunks]
        citations = list({c.get("policy_name", "Policy Document") for c in chunks})

        return {
            "policy_context": context,
            "citations": citations,
            "step_log": [log_entry + f" → {len(context)} chunks retrieved"]
        }
    except Exception as e:
        return {
            "policy_context": [],
            "citations": ["Lexinel Rulebook"],
            "step_log": [f"[{_ts()}] POLICY_RAG_ERROR: {e}"]
        }


# ──────────────────────────────────────────────────────────────────────────────
# NODE 3 — RISK ASSESSOR
# Gemini reads the input + policy context and returns a structured risk score
# ──────────────────────────────────────────────────────────────────────────────
async def risk_assessor_node(state: LexinelState) -> dict:
    """
    Gemini-powered semantic risk assessment. Returns a 0-1 score,
    a label (LOW/MEDIUM/HIGH/CRITICAL), and the reasoning behind it.
    """
    log_entry = f"[{_ts()}] RISK_ASSESSOR: Running Gemini risk analysis"
    print(log_entry)

    context_block = "\n".join(state["policy_context"][:3]) if state["policy_context"] else "No policy context loaded."
    tx_info = json.dumps(state["transaction"], indent=2) if state.get("transaction") else "N/A"

    prompt = f"""You are a Senior AML Risk Officer. Assess the following for AML/BSA compliance risk.

USER INPUT: {state['message']}

TRANSACTION DATA: {tx_info}

RELEVANT POLICY CONTEXT:
{context_block}

Respond ONLY in this exact JSON format — no extra text:
{{
  "risk_score": <float 0.0 to 1.0>,
  "risk_label": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "risk_reasons": ["<reason 1>", "<reason 2>", "<reason 3>"]
}}"""

    try:
        raw = await gemini.chat_compliance(prompt, context_block)
        # Strip markdown fences if present
        cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(cleaned)
        score = float(result.get("risk_score", 0.0))
        label = result.get("risk_label", "LOW")
        reasons = result.get("risk_reasons", [])

        return {
            "risk_score": score,
            "risk_label": label,
            "risk_reasons": reasons,
            "step_log": [log_entry + f" → score={score:.2f} label={label}"]
        }
    except Exception as e:
        return {
            "risk_score": 0.1,
            "risk_label": "LOW",
            "risk_reasons": [f"Risk assessment error: {e}"],
            "step_log": [f"[{_ts()}] RISK_ASSESSOR_ERROR: {e}"]
        }


# ──────────────────────────────────────────────────────────────────────────────
# NODE 4 — VIOLATION CHECKER
# Runs the deterministic rule engine against known AML rules (AML-R01..R05)
# ──────────────────────────────────────────────────────────────────────────────
async def violation_checker_node(state: LexinelState) -> dict:
    """
    Deterministic check — looks for CTR triggers, smurfing patterns, OFAC hits.
    High risk_score from Gemini + rule match = confirmed violation.
    """
    log_entry = f"[{_ts()}] VIOLATION_CHECKER: Running deterministic rule engine"
    print(log_entry)

    tx = state.get("transaction") or {}
    amount = float(tx.get("TRAN_AMT", tx.get("amount", 0)))
    violations = []

    # AML-R01: CTR Threshold — BSA §1010.310
    if amount >= 10_000:
        violations.append({
            "rule_id": "AML-R01",
            "rule_name": "CTR Threshold Breach",
            "severity": "HIGH",
            "amount": amount,
            "action": "FLAG_FOR_CTR",
            "framework": "BSA §1010.310"
        })

    # AML-R02: Structuring / Smurfing (heuristic from message)
    msg_lower = state["message"].lower()
    if "structur" in msg_lower or "smurf" in msg_lower or "split" in msg_lower:
        violations.append({
            "rule_id": "AML-R02",
            "rule_name": "Structuring Pattern Detected",
            "severity": "CRITICAL",
            "action": "AUTO_SAR",
            "framework": "BSA §1010.314"
        })

    # AML-R03: Semantic High-Risk Escalation via Gemini score
    if state["risk_score"] >= 0.75 and not violations:
        violations.append({
            "rule_id": "AML-R03",
            "rule_name": "Semantic Risk Threshold Breach",
            "severity": state["risk_label"],
            "risk_score": state["risk_score"],
            "action": "REVIEW_QUEUE",
            "framework": "FATF Recommendation 20"
        })

    return {
        "violations": violations,
        "violation_found": len(violations) > 0,
        "step_log": [log_entry + f" → {len(violations)} violation(s) found"]
    }


# ──────────────────────────────────────────────────────────────────────────────
# NODE 5 — SAR DRAFTER
# Gemini writes the formal SAR narrative when a violation is confirmed
# ──────────────────────────────────────────────────────────────────────────────
async def sar_drafter_node(state: LexinelState) -> dict:
    """
    Acts as a Senior AML Investigator — generates the chronological narrative
    for a Suspicious Activity Report (SAR) ready for FinCEN filing.
    """
    log_entry = f"[{_ts()}] SAR_DRAFTER: Generating SAR narrative"
    print(log_entry)

    violations_summary = json.dumps(state["violations"], indent=2)
    tx_info = json.dumps(state.get("transaction") or {}, indent=2)

    prompt = f"""Act as a Senior AML Investigator. Write a formal SAR narrative.

TRANSACTION DETAILS:
{tx_info}

VIOLATIONS DETECTED:
{violations_summary}

INVESTIGATOR NOTES: {state['message']}

Write a professional investigation narrative that covers:
1. Nature and summary of suspicious activity
2. Chronological flow of funds
3. Applicable regulations violated
4. Recommended next steps for law enforcement

Keep it formal, precise, and under 300 words."""

    try:
        narrative = await gemini.chat_compliance(prompt, "\n".join(state["policy_context"]))
        return {
            "sar_narrative": narrative,
            "answer": f"⚠️ Violation confirmed. SAR drafted automatically.\n\n{narrative[:200]}...",
            "step_log": [log_entry + " → SAR narrative generated"]
        }
    except Exception as e:
        return {
            "sar_narrative": "SAR generation failed — manual review required.",
            "answer": "Violation detected. SAR generation encountered an error. Please review manually.",
            "step_log": [f"[{_ts()}] SAR_DRAFTER_ERROR: {e}"]
        }


# ──────────────────────────────────────────────────────────────────────────────
# NODE 6 — SIEM NOTIFIER
# Dispatches the violation event to the configured SIEM webhook endpoint
# ──────────────────────────────────────────────────────────────────────────────
async def siem_notifier_node(state: LexinelState) -> dict:
    """
    Sends a structured violation event to the SIEM webhook (Splunk/Datadog/etc.)
    Uses httpx for async, non-blocking dispatch.
    """
    import httpx, os

    log_entry = f"[{_ts()}] SIEM_NOTIFIER: Dispatching violation event"
    print(log_entry)

    webhook_url = os.getenv("WEBHOOK_URL", "http://localhost:7860/api/webhook/mock")
    payload = {
        "source": "lexinel-langgraph-agent",
        "agent_id": state["agent_id"],
        "timestamp": _ts(),
        "risk_label": state["risk_label"],
        "risk_score": state["risk_score"],
        "violations": state["violations"],
        "sar_narrative_preview": state["sar_narrative"][:200] if state.get("sar_narrative") else ""
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(webhook_url, json=payload, timeout=3.0)
            notified = res.status_code == 200
    except Exception as e:
        print(f"[SIEM] Dispatch error: {e}")
        notified = False

    return {
        "siem_notified": notified,
        "step_log": [log_entry + f" → notified={notified}"]
    }


# ──────────────────────────────────────────────────────────────────────────────
# NODE 7 — COMPLIANCE RESPONDER
# Final node for clean (non-violation) paths — crafts a grounded chat answer
# ──────────────────────────────────────────────────────────────────────────────
async def compliance_responder_node(state: LexinelState) -> dict:
    """
    Called when no violations are detected. Uses Gemini + RAG context to
    generate a clean, grounded answer to the user's compliance question.
    """
    log_entry = f"[{_ts()}] COMPLIANCE_RESPONDER: Generating compliance answer"
    print(log_entry)

    context = "\n".join(state["policy_context"]) if state["policy_context"] else ""
    try:
        answer = await gemini.chat_compliance(state["message"], context)
        return {
            "answer": answer,
            "step_log": [log_entry + " → answer generated"]
        }
    except Exception as e:
        return {
            "answer": "Unable to generate a compliance response. Please consult the policy documentation.",
            "step_log": [f"[{_ts()}] COMPLIANCE_RESPONDER_ERROR: {e}"]
        }


# ──────────────────────────────────────────────────────────────────────────────
# NODE 8 — BLOCKED RESPONDER
# Terminal node for hard-blocked inputs
# ──────────────────────────────────────────────────────────────────────────────
async def blocked_responder_node(state: LexinelState) -> dict:
    """Formats the response when the safety guard hard-blocks the input."""
    log_entry = f"[{_ts()}] BLOCKED: Input blocked by PolicyGuard — {state['block_reason']}"
    print(log_entry)
    return {
        "answer": f"🚫 Compliance Alert: {state['block_reason']}",
        "citations": ["PolicyGuard Governance Engine"],
        "step_log": [log_entry]
    }


# ── Utility ────────────────────────────────────────────────────────────────────
def _ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
