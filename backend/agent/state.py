"""
Lexinel AML Agent — State Schema
Defines the shared state that flows through every node in the LangGraph.
"""

from typing import TypedDict, Optional, List, Dict, Any, Annotated
import operator


class LexinelState(TypedDict):
    """
    The single source of truth that every LangGraph node reads from and writes into.
    Uses Annotated[list, operator.add] for fields that nodes append to (audit log, violations).
    """
    # ── INPUT ─────────────────────────────────────────────────────────────────
    message: str                                # Raw user message or transaction descriptor
    agent_id: str                               # e.g. "sentinel-chat", "sar-pipeline"
    transaction: Optional[Dict[str, Any]]       # Raw transaction dict (Sentinel mode)

    # ── SAFETY GUARD ──────────────────────────────────────────────────────────
    is_blocked: bool                            # Hard block from policy guardrail
    block_reason: str                           # Why it was blocked

    # ── RAG ───────────────────────────────────────────────────────────────────
    policy_context: List[str]                   # Top-K policy text chunks from vector store

    # ── RISK ASSESSMENT ───────────────────────────────────────────────────────
    risk_score: float                           # 0.0 (clean) → 1.0 (critical)
    risk_reasons: List[str]                     # Gemini's reasoning bullets
    risk_label: str                             # LOW | MEDIUM | HIGH | CRITICAL

    # ── VIOLATION DETECTION ───────────────────────────────────────────────────
    violations: Annotated[List[Dict], operator.add]     # Each detected violation
    violation_found: bool

    # ── SAR GENERATION ────────────────────────────────────────────────────────
    sar_narrative: str                          # Gemini-authored SAR text
    sar_filing_id: str                          # Returned from FinCEN mock

    # ── SIEM NOTIFICATION ─────────────────────────────────────────────────────
    siem_notified: bool

    # ── FINAL ANSWER ──────────────────────────────────────────────────────────
    answer: str                                 # Chat/compliance answer
    citations: List[str]                        # Source policy references

    # ── AUDIT TRAIL ───────────────────────────────────────────────────────────
    step_log: Annotated[List[str], operator.add]  # Append-only execution log
