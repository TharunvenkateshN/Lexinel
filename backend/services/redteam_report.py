from fpdf import FPDF
from datetime import datetime
import uuid
import json

class RedTeamReportGenerator:
    def __init__(self):
        pass

    def create_vulnerability_dossier(self, scenario_name: str, verdict: str, report_data: dict) -> bytes:
        """
        Generates a premium-grade Red Team Penetration Testing Report.
        """
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # ── FRONT COVER ──
        pdf.set_fill_color(3, 8, 6) # Dark Lexinel Theme
        pdf.rect(0, 0, 210, 297, 'F')
        
        pdf.set_font("Arial", "B", 32)
        pdf.set_text_color(26, 255, 140) # Lexinel Green
        pdf.ln(60)
        pdf.cell(0, 20, "LEXINEL SENTINEL", 0, 1, "C")
        
        pdf.set_font("Arial", "", 16)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 10, "OFFENSIVE SECURITY EVALUATION", 0, 1, "C")
        
        pdf.ln(40)
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, f"SCENARIO: {scenario_name.upper()}", 0, 1, "C")
        
        pdf.set_font("Arial", "B", 12)
        color = (255, 60, 60) if verdict == 'VULNERABLE' else (26, 255, 140)
        pdf.set_text_color(*color)
        pdf.cell(0, 10, f"VERDICT: {verdict}", 0, 1, "C")
        
        pdf.ln(80)
        pdf.set_font("Arial", "I", 10)
        pdf.set_text_color(150, 150, 150)
        pdf.cell(0, 10, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 0, 1, "C")
        pdf.cell(0, 5, f"Dossier ID: {str(uuid.uuid4())}", 0, 1, "C")

        # ── TECHNICAL BREAKDOWN PAGE ──
        pdf.add_page()
        pdf.set_text_color(0, 0, 0)
        
        # Header
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 15, "EXECUTIVE SUMMARY", 0, 1)
        pdf.set_font("Arial", "", 11)
        pdf.multi_cell(0, 7, f"This report details the results of an adversarial simulation against the Lexinel AML policy engine. The objective was to evaluate the resilience of implemented governance rules against the '{scenario_name}' attack vector.")
        
        pdf.ln(10)
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "1. ATTACK VECTORS ANALYZED", 0, 1)
        
        vectors = report_data.get('attack_vectors', [])
        for i, vec in enumerate(vectors):
            pdf.set_font("Arial", "B", 11)
            pdf.set_fill_color(240, 240, 240)
            pdf.cell(0, 10, f"Vector {i+1}: {vec.get('method', 'Adversarial Injection')}", 1, 1, 'L', True)
            
            pdf.set_font("Arial", "", 10)
            pdf.cell(30, 8, "Severity:", 0, 0)
            pdf.set_font("Arial", "B", 10)
            pdf.cell(0, 8, f"{vec.get('severity_percent', 0)}%", 0, 1)
            
            pdf.set_font("Arial", "", 10)
            pdf.cell(30, 8, "Likelihood:", 0, 0)
            pdf.set_font("Arial", "B", 10)
            pdf.cell(0, 8, vec.get('likelihood', 'Medium'), 0, 1)
            
            pdf.ln(2)
            pdf.set_font("Arial", "B", 10)
            pdf.cell(0, 8, "Impact Analysis:", 0, 1)
            pdf.set_font("Arial", "", 10)
            pdf.multi_cell(0, 6, vec.get('impact', 'No impact description found.'))
            
            pdf.ln(5)
            pdf.set_font("Arial", "B", 10)
            pdf.set_text_color(0, 150, 0)
            pdf.cell(0, 8, "Recommended Mitigation:", 0, 1)
            pdf.set_text_color(0,0,0)
            pdf.set_font("Arial", "I", 10)
            pdf.multi_cell(0, 6, vec.get('mitigation', 'Ensure strict PII and keyword enforcement filters are active.'))
            pdf.ln(10)

        # ── COMPLIANCE SCORE ──
        pdf.ln(10)
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "2. RESILIENCE SCORING", 0, 1)
        
        score = report_data.get('overall_resilience_score', 0)
        pdf.set_font("Arial", "B", 24)
        pdf.set_text_color(26, 170, 100)
        pdf.cell(0, 20, f"{score}/100", 0, 1, "C")
        
        pdf.set_font("Arial", "", 10)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 5, "Composite score based on bypass probability and policy coverage.", 0, 1, "C")
        
        pdf.ln(20)
        pdf.set_font("Arial", "I", 8)
        pdf.cell(0, 10, "CONFIDENTIAL - Lexinel Internal Governance Document", 0, 1, "C")
        
        return bytes(pdf.output())
