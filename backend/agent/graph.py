"""
Lexinel AML Agent — LangGraph Graph Definition
Assembles nodes + conditional edges into a compiled StateGraph.

Execution Flow:
  START
    └─► safety_guard
          ├─(blocked)──► blocked_responder ──► END
          └─(safe)────► policy_rag
                          └─► risk_assessor
                                ├─(risk < 0.5)──► compliance_responder ──► END
                                └─(risk ≥ 0.5)──► violation_checker
                                                    ├─(no violation)──► compliance_responder ──► END
                                                    └─(violation)────► sar_drafter
                                                                         └─► siem_notifier ──► END
"""

from langgraph.graph import StateGraph, END, START
from .state import LexinelState
from .nodes import (
    safety_guard_node,
    policy_rag_node,
    risk_assessor_node,
    violation_checker_node,
    sar_drafter_node,
    siem_notifier_node,
    compliance_responder_node,
    blocked_responder_node,
)


# ── Conditional Edge Functions ─────────────────────────────────────────────────

def route_after_safety(state: LexinelState) -> str:
    """After SafetyGuard: hard-block → blocked_responder, else → policy_rag"""
    return "blocked_responder" if state.get("is_blocked") else "policy_rag"


def route_after_risk(state: LexinelState) -> str:
    """After RiskAssessor: high risk needs rule-check, low risk goes straight to answer"""
    return "violation_checker" if state.get("risk_score", 0.0) >= 0.5 else "compliance_responder"


def route_after_violation(state: LexinelState) -> str:
    """After ViolationChecker: confirmed violation → SAR + SIEM, else → answer"""
    return "sar_drafter" if state.get("violation_found") else "compliance_responder"


# ── Build Graph ────────────────────────────────────────────────────────────────

def build_lexinel_graph() -> StateGraph:
    """
    Constructs and compiles the full Lexinel AML LangGraph.
    Returns a compiled graph ready for .ainvoke().
    """
    graph = StateGraph(LexinelState)

    # Register all nodes
    graph.add_node("safety_guard",        safety_guard_node)
    graph.add_node("policy_rag",          policy_rag_node)
    graph.add_node("risk_assessor",       risk_assessor_node)
    graph.add_node("violation_checker",   violation_checker_node)
    graph.add_node("sar_drafter",         sar_drafter_node)
    graph.add_node("siem_notifier",       siem_notifier_node)
    graph.add_node("compliance_responder", compliance_responder_node)
    graph.add_node("blocked_responder",   blocked_responder_node)

    # Entry point
    graph.add_edge(START, "safety_guard")

    # Conditional: safety_guard → blocked or policy_rag
    graph.add_conditional_edges(
        "safety_guard",
        route_after_safety,
        {
            "blocked_responder": "blocked_responder",
            "policy_rag":        "policy_rag",
        }
    )

    # Linear: policy_rag → risk_assessor
    graph.add_edge("policy_rag", "risk_assessor")

    # Conditional: risk_assessor → violation_checker or compliance_responder
    graph.add_conditional_edges(
        "risk_assessor",
        route_after_risk,
        {
            "violation_checker":  "violation_checker",
            "compliance_responder": "compliance_responder",
        }
    )

    # Conditional: violation_checker → sar_drafter or compliance_responder
    graph.add_conditional_edges(
        "violation_checker",
        route_after_violation,
        {
            "sar_drafter":         "sar_drafter",
            "compliance_responder": "compliance_responder",
        }
    )

    # Linear: sar_drafter → siem_notifier
    graph.add_edge("sar_drafter", "siem_notifier")

    # All terminal nodes → END
    graph.add_edge("siem_notifier",       END)
    graph.add_edge("compliance_responder", END)
    graph.add_edge("blocked_responder",   END)

    return graph.compile()


# ── Singleton compiled graph ───────────────────────────────────────────────────
lexinel_agent = build_lexinel_graph()


# ── Helper: run the graph ──────────────────────────────────────────────────────
async def run_agent(
    message: str,
    agent_id: str = "sentinel-chat",
    transaction: dict = None,
    history: list = None,
) -> dict:
    """
    Convenience wrapper. Builds initial state and runs the compiled graph.
    Returns the final state dict.
    """
    initial_state: LexinelState = {
        "message":        message,
        "agent_id":       agent_id,
        "transaction":    transaction,
        "is_blocked":     False,
        "block_reason":   "",
        "policy_context": [],
        "risk_score":     0.0,
        "risk_reasons":   [],
        "risk_label":     "LOW",
        "violations":     [],
        "violation_found": False,
        "sar_narrative":  "",
        "sar_filing_id":  "",
        "siem_notified":  False,
        "answer":         "",
        "citations":      [],
        "step_log":       [f"[START] agent_id={agent_id} | input='{message[:60]}'"],
    }

    final_state = await lexinel_agent.ainvoke(initial_state)
    return final_state
