from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from services.sentinel_service import sentinel_scanner
from services.sar_generator import SARGenerator
from services.gemini import GeminiService
from services.storage import policy_db
import json
import io

router = APIRouter()
sar_gen = SARGenerator()
gemini = GeminiService()

@router.get("/scan")
async def start_sentinel_scan():
    """
    Starts a real-time scan of the IBM AML transactions.
    """
    async def event_generator():
        async for result in sentinel_scanner.scan_stream():
            yield f"data: {result.json()}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/violations")
async def get_violations():
    """
    Returns the queue of flagged transactions pending review.
    """
    return policy_db.get_hitl_violations()

@router.post("/resolve")
async def resolve_violation(data: dict = Body(...)):
    """
    Clears a violation from the HITL queue.
    """
    violation_id = data.get("id")
    if violation_id:
        policy_db.resolve_hitl_violation(violation_id)
        return {"status": "resolved"}
    raise HTTPException(status_code=400, detail="Missing violation id")

@router.post("/sar")
async def generate_sar(violation: dict = Body(...)):
    """
    Generates a formal SAR PDF for a specific violation.
    Uses Gemini to generate the chronological narrative.
    """
    try:
        # 1. Generate Narrative with Gemini
        prompt = f"""
        Act as a Senior AML Investigator. Generate a formal chronological narrative for a Suspicious Activity Report (SAR).
        Transaction Details: {json.dumps(violation)}
        
        The narrative should explain:
        1. Why this activity is suspicious (e.g. high value, smurfing, tax haven).
        2. The chronological flow of funds.
        3. Recommended next steps for law enforcement.
        
        Keep it professional, detailed, and forensic.
        """
        narrative = await gemini.chat_compliance(prompt, "SAR Narrative Generation Context")
        
        # 2. Generate PDF
        pdf_bytes = sar_gen.create_sar_report(violation, narrative)
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=SAR_{violation.get('id', 'Unknown')}.pdf"}
        )
    except Exception as e:
        print(f"[Sentinel API] SAR Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
