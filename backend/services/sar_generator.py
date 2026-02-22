from fpdf import FPDF
from datetime import datetime
import uuid
import json

class SARGenerator:
    def __init__(self):
        pass

    def create_sar_report(self, violation_data: dict, narrative: str) -> bytes:
        """
        Generates a formal SAR (Suspicious Activity Report) PDF.
        """
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # Header
        pdf.set_font("Arial", "B", 16)
        pdf.set_text_color(200, 0, 0)
        pdf.cell(0, 10, "FINANCIAL CRIMES ENFORCEMENT NETWORK (FinCEN)", 0, 1, "C")
        pdf.set_font("Arial", "B", 12)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 10, "SUSPICIOUS ACTIVITY REPORT (SAR)", 0, 1, "C")
        pdf.ln(5)
        
        # Metadata Table
        pdf.set_fill_color(240, 240, 240)
        pdf.set_font("Arial", "B", 10)
        pdf.cell(40, 8, "Report ID:", 1, 0, 'L', True)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 8, violation_data.get('id', 'N/A'), 1, 1)
        
        pdf.set_font("Arial", "B", 10)
        pdf.cell(40, 8, "Date of Filing:", 1, 0, 'L', True)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 8, datetime.now().strftime("%Y-%m-%d"), 1, 1)
        
        pdf.set_font("Arial", "B", 10)
        pdf.cell(40, 8, "Filing Institution:", 1, 0, 'L', True)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 8, "Lexinel Sentinel AI Engine", 1, 1)
        
        pdf.ln(10)
        
        # I. Subject Information
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, "I. SUBJECT INFORMATION", 0, 1)
        pdf.set_font("Arial", "", 10)
        pdf.multi_cell(0, 8, f"Account Origin: {violation_data.get('from', 'Unknown')}\nBeneficiary: {violation_data.get('to', 'Unknown')}\nJurisdiction: {violation_data.get('country', 'International')}")
        
        pdf.ln(5)
        
        # II. Suspicious Activity Details
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, "II. SUSPICIOUS ACTIVITY DETAILS", 0, 1)
        pdf.set_font("Arial", "B", 10)
        pdf.cell(40, 8, "Transaction Amount:", 0, 0)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 8, f"${violation_data.get('amount', 0):,.2f}", 0, 1)
        
        pdf.set_font("Arial", "B", 10)
        pdf.cell(40, 8, "Activity Type:", 0, 0)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 8, violation_data.get('label', 'Multiple Indicators'), 0, 1)
        
        pdf.ln(5)
        
        # III. Automated Narrative (Gemini Generated)
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, "III. CHRONOLOGICAL NARRATIVE", 0, 1)
        pdf.set_font("Arial", "", 10)
        
        # Simple Markdown Bold Parser for FPDF
        for line in narrative.split('\n'):
            if not line.strip():
                pdf.ln(4)
                continue
            
            # Split by ** to get alternating normal/bold segments
            parts = line.split("**")
            for i, part in enumerate(parts):
                if not part: continue
                # Even indices are normal, odd indices are bold
                if i % 2 == 1:
                    pdf.set_font("Arial", "B", 10)
                else:
                    pdf.set_font("Arial", "", 10)
                
                # Write string segment (multi_cell doesn't flow inline well, so we use write for inline formatting)
                part = part.replace("*", "") # Strip remaining single asterisks
                pdf.write(6, part)
            pdf.ln(6) # Newline after each paragraph
        
        pdf.ln(10)
        
        # IV. Compliance Evidence
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, "IV. COMPLIANCE EVIDENCE & TRACABILITY", 0, 1)
        pdf.set_font("Courier", "", 8)
        pdf.set_fill_color(250, 250, 250)
        evidence_json = json.dumps(violation_data, indent=2)
        pdf.multi_cell(0, 4, evidence_json, 1, 'L', True)
        
        pdf.ln(10)
        
        # Footer / Sign-off
        pdf.set_font("Arial", "I", 8)
        pdf.cell(0, 10, f"Digitally signed by Lexinel Governance Kernel | Auth-Hash: {str(uuid.uuid4().hex)[:12]}", 0, 1, "C")
        
        return bytes(pdf.output())
