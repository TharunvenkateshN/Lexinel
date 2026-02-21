from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Transaction(BaseModel):
    id: str
    from_account: str
    to_account: str
    amount: float
    type: str
    timestamp: datetime
    country: str
    is_cross_border: bool = False
    
class SentinelDetection(BaseModel):
    rule_id: str
    rule_label: str
    reason: str
    severity: str # LOW, MEDIUM, HIGH, CRITICAL

class SentinelResult(BaseModel):
    transaction_id: str
    timestamp: str
    verdict: str # COMPLIANT, FLAGGED
    detections: List[SentinelDetection] = []
    risk_score: int # 0-100
    evidence_summary: str
