import json
import os
import asyncio
import re
from datetime import datetime
from typing import List, Dict
from models.transaction import Transaction, SentinelResult, SentinelDetection
from services.storage import policy_db

class SentinelScanner:
    def __init__(self):
        self.data_path = os.path.join(os.path.dirname(__file__), "..", "data", "ibm_aml_sample.json")
    
    def _load_mock_data(self) -> List[Dict]:
        if os.path.exists(self.data_path):
            with open(self.data_path, "r") as f:
                return json.load(f)
        return []

    def evaluate_rule(self, transaction: Dict, rule_logic: str) -> bool:
        """
        Refined logic evaluator for sentinel rules.
        """
        try:
            logic = str(rule_logic).lower()
            
            # 1. Amount Thresholds
            if "amount >" in logic:
                match = re.search(r"amount >\s*(\d+)", logic)
                if match and transaction['amount'] <= float(match.group(1)): return False
            
            if "amount <" in logic:
                match = re.search(r"amount <\s*(\d+)", logic)
                if match and transaction['amount'] >= float(match.group(1)): return False
                
            # 2. Jurisdictional Checks
            if "country =" in logic or "country is" in logic:
                for word in logic.split():
                    if len(word) == 2 and word.upper() != transaction['country']:
                        # Crude check for country code mismatch
                        if word.upper() in ["US", "CN", "RU", "UK", "KY"]:
                             return False
                             
            # 3. Cross-border Flag
            if "cross-border" in logic or "cross_border" in logic:
                if "true" in logic and not transaction.get('is_cross_border', False): return False
                if "false" in logic and transaction.get('is_cross_border', False): return False
            
            # 4. Transaction Types
            if "type =" in logic:
                match = re.search(r"type =\s*(\w+)", logic)
                if match and transaction['type'].lower() != match.group(1).lower(): return False
                
            return True
        except Exception as e:
            print(f"[Sentinel] Eval Error: {e}")
            return False

    async def scan_stream(self):
        """
        Streams scan results for the Sentinel UI.
        """
        transactions = self._load_mock_data()
        active_rules = [p for p in policy_db.get_all_policies() if p.is_active]
        
        # If no active synthesized rules, use default fallback rules
        if not active_rules:
            rules_to_use = [
                {"id": "R-DFLT-1", "name": "High Value Alert", "logic": "amount > 10000", "summary": "Default threshold check"},
                {"id": "R-DFLT-2", "name": "Cross Border Risk", "logic": "cross_border = true", "summary": "International risk check"}
            ]
        else:
            rules_to_use = [{"id": p.id, "name": p.name, "logic": p.content, "summary": p.summary} for p in active_rules]

        for txn in transactions:
            detections = []
            risk_score = 0
            
            for rule in rules_to_use:
                if self.evaluate_rule(txn, rule['logic']):
                    detections.append(SentinelDetection(
                        rule_id=rule['id'],
                        rule_label=rule['name'],
                        reason=f"Transaction matches logic: {str(rule['logic'])[:50]}...",
                        severity="HIGH" if txn['amount'] > 50000 else "MEDIUM"
                    ))
                    risk_score += 30
            
            result = SentinelResult(
                transaction_id=txn['id'],
                timestamp=txn['timestamp'],
                verdict="FLAGGED" if detections else "COMPLIANT",
                detections=detections,
                risk_score=min(100, risk_score),
                evidence_summary=f"Processed {txn['id']} - Orig: {txn['from']}, Dest: {txn['to']}, Amt: ${txn['amount']}"
            )
            if detections:
                policy_db.add_hitl_violation(result.model_dump())
            
            yield result
            await asyncio.sleep(0.5) # Simulate processing time

# Global instance
sentinel_scanner = SentinelScanner()
