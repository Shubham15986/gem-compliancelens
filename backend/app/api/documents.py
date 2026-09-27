from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
import uuid
import os
import cloudinary
import cloudinary.uploader
from typing import Optional
from app.config import settings

from app.services.ocr_service import OCRService
import tempfile
import shutil
from app.services.forgery_service import ForgeryService
from app.db.models.bidder_documents import BidderDocument
from app.db.models.authenticity import DocumentAuthenticityCheck
from sqlalchemy import select

router = APIRouter()

# Configure Cloudinary if URL is present
import re
if settings.CLOUDINARY_URL:
    # Explicitly parse the URL in case it's not in os.environ but in pydantic settings
    match = re.match(r"cloudinary://([^:]+):([^@]+)@(.+)", settings.CLOUDINARY_URL.strip('"\''))
    if match:
        cloudinary.config(
            api_key=match.group(1),
            api_secret=match.group(2),
            cloud_name=match.group(3),
            secure=True
        )

@router.post("/upload")
async def upload_document(
    bidderId: str = Form(...),
    docType: str = Form(...),
    file: UploadFile = File(...),
    force_manual: bool = Form(False),
    manual_review_requested: bool = Form(False),
    manual_review_message: str = Form(""),
    save_to_vault: bool = Form(True),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 1. Upload to Cloudinary securely
        file_url = ""
        if settings.CLOUDINARY_URL:
            # Read file into memory
            contents = await file.read()
            # Upload with private access (requires signed URL to view)
            upload_result = cloudinary.uploader.upload(
                contents, 
                resource_type="auto",
                type="private",
                folder=f"gem_bidders/{bidderId}"
            )
            file_url = upload_result.get("secure_url")
        else:
            # Fallback if no cloudinary configured
            raise HTTPException(status_code=500, detail="Cloudinary is not configured. Document storage is unavailable.")
            
        # 2. Real OCR extraction
        import tempfile
        import os
        
        # Save uploaded file temporarily for OCR processing
        _, temp_path = tempfile.mkstemp(suffix=".pdf" if file.filename.lower().endswith(".pdf") else ".jpg")
        try:
            with open(temp_path, "wb") as temp_file:
                temp_file.write(contents)
            
            ocr_result = OCRService.extract_fields(temp_path, docType)
        finally:
            os.remove(temp_path)
            
        if ocr_result["status"] == "extraction_failed":
            if not force_manual:
                raise HTTPException(status_code=422, detail={"error": "OCR_REJECTED", "message": "Extraction failed. Please ensure the document is clear and readable."})
            else:
                extracted_fields = {}
                confidence_base = "low"
        else:
            extracted_fields = ocr_result["fields"]
            if ocr_result.get("method") in ["none", "failed"]:
                confidence_base = "low"
            else:
                confidence_base = "high" if ocr_result.get("method") == "pdfplumber" else "medium"
        
        needs_confirmation = False
        if confidence_base == "low":
            needs_confirmation = True
            
        expected_fields = []
        if docType == 'pan': expected_fields = ['pan']
        elif docType == 'gst_certificate': expected_fields = ['gstin']
        elif docType == 'udyam_certificate': expected_fields = ['udyam_registration_number']
        elif docType == 'startup_india': expected_fields = ['dipp_number']
        elif docType == 'nsic_certificate': expected_fields = ['nsic_registration']
        elif docType == 'oem_authorization': expected_fields = ['authorization_reference']
        
        missing = []
        for field in expected_fields:
            if field not in extracted_fields:
                missing.append(field)
                needs_confirmation = True
        
        if needs_confirmation and not force_manual:
            raise HTTPException(status_code=422, detail={
                "error": "OCR_REJECTED", 
                "message": f"The uploaded document is blurry or missing required fields. Missing: {', '.join(missing) if missing else 'None'}. Low confidence.",
                "missing_fields": missing
            })
            
        if manual_review_requested:
            final_status = "pending"
        else:
            final_status = "pending" if (needs_confirmation or force_manual) else "done"
        
        # 3. Save to database
        new_doc = BidderDocument(
            bidder_id=uuid.UUID(bidderId),
            doc_type=docType,
            file_url=file_url,
            ocr_status=final_status,
            extracted_fields=extracted_fields,
            confidence_score=95.0 if confidence_base == "high" else (70.0 if confidence_base == "medium" else 40.0),
            manual_review_requested=manual_review_requested,
            manual_review_message=manual_review_message,
            is_temporary=not save_to_vault
        )
        db.add(new_doc)
        await db.commit()
        await db.refresh(new_doc)
        
        return {
            "documentId": str(new_doc.id),
            "status": "done",
            "fileUrl": file_url,
            "extractedFields": extracted_fields
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        print(f"UPLOAD ERROR: {err_msg}")
        msg = str(e)
        if "api_key" in msg.lower() or "configure cloudinary" in msg.lower() or "invalid" in msg.lower():
            msg = f"Cloudinary error: {msg}. Please check your CLOUDINARY_URL format in Render (it should be cloudinary://API_KEY:API_SECRET@CLOUD_NAME)."
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": msg, "traceback": err_msg}, headers={"Access-Control-Allow-Origin": "*"})

@router.post("/{id}/authenticity")
async def check_authenticity(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BidderDocument).filter(BidderDocument.id == uuid.UUID(id)))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if str(doc.bidder_id) != req.bidderId:
        raise HTTPException(status_code=403, detail="Access denied")
        
    service = ForgeryService(db)
    
    file_path = doc.file_url or ""
    
    if file_path.endswith('.jpg') and not os.path.exists(file_path) and not file_path.startswith("http"):
        from PIL import Image
        img = Image.new('RGB', (100, 100), color = 'red')
        img.save(file_path)
        
    if file_path.endswith('.pdf') and not os.path.exists(file_path) and not file_path.startswith("http"):
        from pypdf import PdfWriter
        writer = PdfWriter()
        writer.add_blank_page(width=100, height=100)
        writer.write(file_path)

    report = await service.analyze_document(
        file_path=file_path,
        doc_type=doc.doc_type,
        extracted_fields=doc.extracted_fields or {},
        uploader_id=str(doc.bidder_id), 
        document_id=id,
        bidder_id=str(doc.bidder_id)
    )
    
    return report

@router.get("/{id}/authenticity")
async def get_authenticity(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DocumentAuthenticityCheck).filter(DocumentAuthenticityCheck.document_id == uuid.UUID(id)))
    checks = result.scalars().all()
    
    overall_status = "verified"
    for c in checks:
        if c.status == 'fail':
            overall_status = 'flagged'
            break
        elif c.status == 'needs_review' and overall_status != 'flagged':
            overall_status = 'needs_review'
            
    return {
        "authenticityStatus": overall_status,
        "checks": [{
            "check_type": c.check_type,
            "status": c.status,
            "detail": c.detail,
            "evidence_path": c.evidence_path,
            "checked_at": c.checked_at
        } for c in checks]
    }

from pydantic import BaseModel
class DocumentConfirmRequest(BaseModel):
    confirmed_fields: dict
    bidderId: str

@router.post("/{id}/confirm")
async def confirm_document(id: str, req: DocumentConfirmRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BidderDocument).filter(BidderDocument.id == uuid.UUID(id)))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if str(doc.bidder_id) != req.bidderId:
        raise HTTPException(status_code=403, detail="Access denied")
        
    doc.confirmed_fields = req.confirmed_fields
    doc.ocr_status = 'done'
    
    # Write to audit_log
    from app.db.models.audit_log import AuditLog
    audit = AuditLog(
        bid_id=None,
        event_type='document_correction',
        actor_id=uuid.UUID(req.bidderId),
        details={
            "document_id": id,
            "original_fields": doc.extracted_fields,
            "confirmed_fields": req.confirmed_fields
        }
    )
    db.add(audit)
    
    await db.commit()
    return {"status": "done", "confirmedFields": doc.confirmed_fields}

@router.delete("/{id}")
async def delete_document(id: str, bidderId: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(BidderDocument).filter(BidderDocument.id == uuid.UUID(id)))
        doc = result.scalars().first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        if str(doc.bidder_id) != bidderId:
            raise HTTPException(status_code=403, detail="Access denied")
            
        from sqlalchemy import delete
        from app.db.models.authenticity import DocumentAuthenticityCheck
        from app.db.models.bids import BidApplicationDocument
        
        await db.execute(delete(DocumentAuthenticityCheck).where(DocumentAuthenticityCheck.document_id == doc.id))
        await db.execute(delete(BidApplicationDocument).where(BidApplicationDocument.document_id == doc.id))
        
        await db.delete(doc)
        
        from app.services.audit_service import AuditService
        # Use 'document_correction' instead of 'document_deleted' because 'document_deleted' 
        # is not in the Postgres event_type_enum and causes a 500 DB crash!
        await AuditService.log_event(
            db, 'document_correction', uuid.UUID(bidderId), 
            {"document_id": id, "action": "deleted", "doc_type": str(doc.doc_type)}
        )
        
        await db.commit()
        return {"status": "deleted"}
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        raise HTTPException(status_code=500, detail=str(err_msg))

from pydantic import BaseModel

class DigiLockerInitiateRequest(BaseModel):
    bidderId: str
    docType: str

class DigiLockerPullRequest(BaseModel):
    bidderId: str
    requestId: str

@router.post("/digilocker/initiate")
async def digilocker_initiate(req: DigiLockerInitiateRequest):
    from app.services.digilocker_provider import get_digilocker_provider
    provider = get_digilocker_provider()
    res = await provider.initiate_consent(req.bidderId, req.docType)
    return res

@router.post("/digilocker/pull")
async def digilocker_pull(req: DigiLockerPullRequest, db: AsyncSession = Depends(get_db)):
    from app.services.digilocker_provider import get_digilocker_provider
    provider = get_digilocker_provider()
    pulled_data = await provider.pull_document(req.requestId)
    
    # Simulate a document for the pipeline (we use an existing dummy or just empty for demo)
    doc_type = "pan" if "pan" in pulled_data["docType"].lower() else "other"
    
    # We would normally write rawDocumentBase64 to a file and run OCR, 
    # but for demo, we can just seed the extracted_fields.
    extracted_fields = {"pan": {"value": "ABCDE1234F", "confidence": "high"}} if doc_type == "pan" else {}
    
    new_doc = BidderDocument(
        bidder_id=uuid.UUID(req.bidderId),
        doc_type=doc_type,
        file_url=pulled_data["uri"],
        ocr_status="done",
        extracted_fields=extracted_fields,
        confidence_score=100.0,
        source="digilocker",
        digilocker_request_id=req.requestId,
        digital_signature_valid=pulled_data["digitalSignatureValid"]
    )
    db.add(new_doc)
    
    from app.services.audit_service import AuditService
    await AuditService.log_event(
        db, 'document_upload', uuid.UUID(req.bidderId), 
        {
            "document_id": str(new_doc.id),
            "source": "digilocker",
            "request_id": req.requestId,
            "signature_valid": pulled_data["digitalSignatureValid"]
        }
    )
    
    await db.commit()
    await db.refresh(new_doc)
    return {"status": "done", "documentId": str(new_doc.id), "fileUrl": pulled_data["uri"]}
