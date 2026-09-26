from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_
from app.db.session import get_db
from app.db.models.users import User
from app.db.models.bidders import Bidder
from app.db.models.tenders import Tender
from app.db.models.tender_rules import TenderRule
from app.db.models.bidder_documents import BidderDocument
from app.db.models.evaluations import Evaluation
from app.db.models.evaluation_checks import EvaluationCheck
from app.db.models.decisions import Decision
from app.db.models.audit_log import AuditLog
from app.db.models.bids import BidApplication, BidApplicationDocument, ClarificationRequest
from app.services.rule_engine import RuleEngine
from app.services.explanation_service import ExplanationService
from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional
import uuid
import datetime

router = APIRouter()
explanation_service = ExplanationService()

class DraftRequest(BaseModel):
    tenderId: UUID
    bidderId: UUID

@router.post("")
async def create_draft(req: DraftRequest, db: AsyncSession = Depends(get_db)):
    # Check if tender is private
    tender_res = await db.execute(select(Tender).where(Tender.id == req.tenderId))
    tender = tender_res.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    result = await db.execute(select(BidApplication).where(
        BidApplication.tender_id == req.tenderId,
        BidApplication.bidder_id == req.bidderId
    ))
    existing = result.scalar_one_or_none()
    if existing:
        if tender.access_type == 'private' and existing.status in ['access_pending', 'access_denied']:
            return {"id": existing.id, "status": existing.status, "message": "Access is pending or denied"}
        return {"id": existing.id, "status": existing.status}
        
    # If private, automatically put into access_pending
    status = 'access_pending' if tender.access_type == 'private' else 'draft'
    
    bid = BidApplication(
        tender_id=req.tenderId,
        bidder_id=req.bidderId,
        status=status
    )
    db.add(bid)
    await db.commit()
    await db.refresh(bid)
    return {"id": bid.id, "status": bid.status}

@router.post("/{id}/grant-access")
async def grant_access(id: uuid.UUID, officerId: UUID = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BidApplication).where(BidApplication.id == id))
    bid = result.scalar_one_or_none()
    if not bid or bid.status != 'access_pending':
        raise HTTPException(status_code=400, detail="No pending access request found")
    
    bid.status = 'draft'
    
    audit = AuditLog(
        bid_id=id,
        event_type='decision_submitted',
        actor_id=officerId,
        details={"action": "access_granted"}
    )
    db.add(audit)
    await db.commit()
    return {"status": "success"}

@router.post("/{id}/deny-access")
async def deny_access(id: uuid.UUID, officerId: UUID = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BidApplication).where(BidApplication.id == id))
    bid = result.scalar_one_or_none()
    if not bid or bid.status != 'access_pending':
        raise HTTPException(status_code=400, detail="No pending access request found")
    
    bid.status = 'access_denied'
    
    audit = AuditLog(
        bid_id=id,
        event_type='decision_submitted',
        actor_id=officerId,
        details={"action": "access_denied"}
    )
    db.add(audit)
    await db.commit()
    return {"status": "success"}

class AttachDocsRequest(BaseModel):
    documentIds: List[UUID]

@router.patch("/{id}/documents")
async def attach_documents(id: uuid.UUID, req: AttachDocsRequest, db: AsyncSession = Depends(get_db)):
    # Delete old attachments
    await db.execute(BidApplicationDocument.__table__.delete().where(BidApplicationDocument.bid_application_id == id))
    # Add new attachments
    docs = [BidApplicationDocument(bid_application_id=id, document_id=did) for did in req.documentIds]
    db.add_all(docs)
    await db.commit()
    return {"status": "success"}

@router.post("/{id}/submit")
async def submit_bid(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BidApplication).where(BidApplication.id == id))
    bid = result.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    if bid.status not in ['draft', 'clarification_requested']:
        raise HTTPException(status_code=409, detail=f"Cannot submit from status {bid.status}")
        
    # Validation
    docs_result = await db.execute(
        select(BidderDocument)
        .join(BidApplicationDocument, BidApplicationDocument.document_id == BidderDocument.id)
        .where(BidApplicationDocument.bid_application_id == id)
    )
    attached_docs = docs_result.scalars().all()
    
    # Check for extraction failures or pending
    blockers = []
    for doc in attached_docs:
        if doc.ocr_status in ['failed', 'pending']:
            blockers.append(f"Document {doc.doc_type} needs confirmation or failed extraction.")
            
    if blockers:
        raise HTTPException(status_code=400, detail={"message": "Submission blocked", "blockers": blockers})
        
    next_status = 'under_evaluation' if bid.status == 'clarification_requested' else 'submitted'
    bid.status = next_status
    bid.submitted_at = datetime.datetime.now(datetime.timezone.utc)
    
    # Audit log
    audit = AuditLog(
        bid_id=id,
        event_type='document_upload', # reusing event types
        actor_id=bid.bidder_id,
        details={"action": "submitted"}
    )
    db.add(audit)
    await db.commit()
    return {"id": bid.id, "status": bid.status}

@router.get("/mine")
async def get_my_bids(bidderId: UUID, db: AsyncSession = Depends(get_db)):
    from app.db.models.decisions import Decision
    result = await db.execute(
        select(BidApplication, Tender, Decision)
        .join(Tender, Tender.id == BidApplication.tender_id)
        .outerjoin(Decision, Decision.evaluation_id == BidApplication.current_evaluation_id)
        .where(BidApplication.bidder_id == bidderId)
    )
    bids = result.all()
    return [{
        "id": b.id,
        "tenderId": b.tender_id,
        "tenderName": t.title,
        "status": b.status,
        "submittedAt": b.submitted_at,
        "declineReason": d.note if d else None
    } for b, t, d in bids]

class EvaluateRequest(BaseModel):
    officerId: UUID

@router.post("/{id}/withdraw")
async def withdraw_bid(id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BidApplication).where(BidApplication.id == id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if app.status in ['qualified', 'disqualified', 'withdrawn']:
        raise HTTPException(status_code=400, detail="Cannot withdraw at this stage")
        
    app.status = 'withdrawn'
    await db.commit()
    return {"status": "success"}

@router.post("/{id}/evaluate")
async def evaluate_bid(id: uuid.UUID, req: EvaluateRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BidApplication).where(BidApplication.id == id))
    bid = result.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    bidder_res = await db.execute(select(Bidder).where(Bidder.id == bid.bidder_id))
    bidder = bidder_res.scalar_one()
    
    rules_res = await db.execute(select(TenderRule).where(TenderRule.tender_id == bid.tender_id))
    rules = rules_res.scalars().all()
    
    # Only pull docs attached to this bid
    docs_result = await db.execute(
        select(BidderDocument)
        .join(BidApplicationDocument, BidApplicationDocument.document_id == BidderDocument.id)
        .where(BidApplicationDocument.bid_application_id == id)
    )
    docs = docs_result.scalars().all()
    
    engine_result = await RuleEngine.evaluate(bidder, rules, docs, db)
    
    eval_record = Evaluation(
        bid_id=id, # using bid_id as bid_application.id
        tender_id=bid.tender_id,
        bidder_id=bid.bidder_id,
        overall_score=engine_result['overall_score'],
        risk_level=engine_result['risk_level'],
        verdict=engine_result['verdict']
    )
    db.add(eval_record)
    await db.flush()
    
    bid.current_evaluation_id = eval_record.id
    if bid.status == 'submitted':
        bid.status = 'under_evaluation'
        
    for check in engine_result['checks']:
        val = check.get('extracted_value')
        val_str = None
        if isinstance(val, dict) and 'value' in val:
            val_str = str(val['value'])
        elif val is not None:
            val_str = str(val)

        chk_record = EvaluationCheck(
            evaluation_id=eval_record.id,
            rule_name=check['rule_name'],
            status=check['status'],
            extracted_value=val_str,
            source=check['source']
        )
        db.add(chk_record)
        
    audit = AuditLog(
        bid_id=id,
        event_type='evaluation_run',
        actor_id=req.officerId,
        details={"score": engine_result['overall_score'], "verdict": engine_result['verdict']}
    )
    db.add(audit)
    await db.commit()
    
    return {"evaluationId": eval_record.id, "checks": engine_result['checks']}

@router.get("/{id}/scorecard")
async def get_scorecard(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BidApplication).where(BidApplication.id == id))
    bid = result.scalar_one_or_none()
    if not bid or not bid.current_evaluation_id:
        raise HTTPException(status_code=404, detail="No evaluation found")
        
    result_eval = await db.execute(select(Evaluation).where(Evaluation.id == bid.current_evaluation_id))
    eval_record = result_eval.scalars().first()
        
    checks_result = await db.execute(select(EvaluationCheck).where(EvaluationCheck.evaluation_id == eval_record.id))
    checks = checks_result.scalars().all()
    
    docs_result = await db.execute(
        select(BidderDocument)
        .join(BidApplicationDocument, BidApplicationDocument.document_id == BidderDocument.id)
        .where(BidApplicationDocument.bid_application_id == id)
    )
    docs = docs_result.scalars().all()
    
    return {
        "score": eval_record.overall_score,
        "riskLevel": eval_record.risk_level,
        "verdict": eval_record.verdict,
        "checks": [{"id": c.id, "name": c.rule_name, "status": c.status, "summary": c.extracted_value} for c in checks],
        "documents": [{"id": str(d.id), "docType": d.doc_type, "fileUrl": d.file_url, "manualReviewRequested": d.manual_review_requested, "manualReviewMessage": d.manual_review_message} for d in docs]
    }

@router.get("/{id}/checks/{checkId}")
async def get_check_detail(id: uuid.UUID, checkId: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EvaluationCheck).where(EvaluationCheck.id == checkId))
    check = result.scalar_one_or_none()
    if not check:
        raise HTTPException(status_code=404, detail="Check not found")
        
    if not check.explanation_text:
        explanation = explanation_service.generate_explanation(
            rule_name=check.rule_name,
            status=check.status,
            extracted_value=check.extracted_value or "",
            source=check.source
        )
        check.explanation_text = explanation
        await db.commit()
        
    return {
        "ruleName": check.rule_name,
        "status": check.status,
        "extractedValue": check.extracted_value,
        "source": check.source,
        "checkedAt": check.checked_at,
        "explanationText": check.explanation_text
    }

class ClarificationReq(BaseModel):
    officerId: UUID
    message: str

@router.post("/{id}/clarification")
async def request_clarification(id: uuid.UUID, req: ClarificationReq, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BidApplication).where(BidApplication.id == id))
    bid = result.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    if bid.status not in ['under_evaluation', 'submitted']:
        raise HTTPException(status_code=409, detail="Invalid status transition")
        
    bid.status = 'clarification_requested'
    cr = ClarificationRequest(
        bid_application_id=id,
        officer_id=req.officerId,
        message=req.message
    )
    db.add(cr)
    
    audit = AuditLog(
        bid_id=id,
        event_type='decision_submitted',
        actor_id=req.officerId,
        details={"action": "clarification_requested", "message": req.message}
    )
    db.add(audit)
    
    await db.commit()
    return {"status": "success"}

class DecisionRequest(BaseModel):
    decision: str
    note: Optional[str] = None
    officerId: UUID

@router.post("/{id}/decision")
async def submit_decision(id: uuid.UUID, req: DecisionRequest, db: AsyncSession = Depends(get_db)):
    if req.decision == 'non_compliant' and not req.note:
        raise HTTPException(status_code=400, detail={"message": "A mandatory description of reasoning is required when declining a bid."})

    result = await db.execute(select(BidApplication).where(BidApplication.id == id))
    bid = result.scalar_one_or_none()
    if not bid or not bid.current_evaluation_id:
        raise HTTPException(status_code=404, detail="Bid or evaluation not found")
        
    if bid.status in ['qualified', 'disqualified', 'pending_approval']:
        raise HTTPException(status_code=409, detail="Decision is final or already pending")
        
    # Check for pending manual verifications
    checks_res = await db.execute(select(EvaluationCheck).where(EvaluationCheck.evaluation_id == bid.current_evaluation_id))
    checks = checks_res.scalars().all()
    pending = []
    for c in checks:
        if c.status == 'needs_review':
            mv_res = await db.execute(select(ManualVerification).where(ManualVerification.evaluation_check_id == c.id))
            if not mv_res.scalars().first():
                pending.append(c.rule_name)
    if pending:
        raise HTTPException(status_code=400, detail={"message": "Pending manual verifications", "pending_checks": pending})
        
    # Check user role
    user_res = await db.execute(select(User).where(User.id == req.officerId))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Officer not found")

    if user.role == 'junior_officer':
        bid.status = 'pending_approval'
    else:
        bid.status = 'qualified' if req.decision == 'compliant' else 'disqualified'
        
    decision = Decision(
        evaluation_id=bid.current_evaluation_id,
        officer_id=req.officerId,
        ai_recommendation='needs_review', 
        final_decision=req.decision,
        note=req.note
    )
    db.add(decision)
    
    audit = AuditLog(
        bid_id=id,
        event_type='decision_submitted',
        actor_id=req.officerId,
        details={"decision": req.decision, "note": req.note, "maker_checker": user.role == 'junior_officer'}
    )
    db.add(audit)
    
    await db.commit()
    return {"decisionId": decision.id, "lockedAt": decision.locked_at, "auditEntryId": audit.id}

@router.get("/{id}/audit-log")
async def get_audit_log(id: uuid.UUID, eventType: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(AuditLog).where(AuditLog.bid_id == id).order_by(AuditLog.created_at.asc())
    if eventType:
        query = query.where(AuditLog.event_type == eventType)
        
    result = await db.execute(query)
    events = result.scalars().all()
    
    return {
        "events": [
            {"type": e.event_type, "actor": str(e.actor_id) if e.actor_id else None, "timestamp": e.created_at, "details": e.details}
            for e in events
        ]
    }

class ApproveDecisionRequest(BaseModel):
    decisionId: UUID
    seniorOfficerId: UUID
    isApproved: bool
    note: Optional[str] = None

@router.post("/{id}/decision/approve")
async def approve_decision(id: uuid.UUID, req: ApproveDecisionRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BidApplication).where(BidApplication.id == id))
    bid = result.scalar_one_or_none()
    if not bid or bid.status != 'pending_approval':
        raise HTTPException(status_code=400, detail="Bid is not pending approval")
        
    # Validate senior officer
    user_res = await db.execute(select(User).where(User.id == req.seniorOfficerId))
    user = user_res.scalar_one_or_none()
    if not user or user.role != 'senior_officer':
        raise HTTPException(status_code=403, detail="Only senior officers can approve decisions")

    # Fetch decision
    dec_res = await db.execute(select(Decision).where(Decision.id == req.decisionId))
    decision = dec_res.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision.checker_id = req.seniorOfficerId
    decision.checker_decision = 'approved' if req.isApproved else 'rejected'
    decision.checker_note = req.note
    decision.checked_at = datetime.datetime.now(datetime.timezone.utc)

    if req.isApproved:
        bid.status = 'qualified' if decision.final_decision == 'compliant' else 'disqualified'
    else:
        bid.status = 'under_evaluation' # send back to review
        
    audit = AuditLog(
        bid_id=id,
        event_type='decision_approved' if req.isApproved else 'decision_rejected',
        actor_id=req.seniorOfficerId,
        details={"checker_decision": decision.checker_decision, "note": req.note}
    )
    db.add(audit)
    
    await db.commit()
    return {"status": "success", "newBidStatus": bid.status}

from app.db.models.manual_verifications import ManualVerification

class ManualVerifyReq(BaseModel):
    officerId: UUID
    outcome: str
    notes: Optional[str] = None

@router.post("/checks/{checkId}/verify")
async def record_manual_verification(checkId: uuid.UUID, req: ManualVerifyReq, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EvaluationCheck).where(EvaluationCheck.id == checkId))
    check = result.scalar_one_or_none()
    if not check:
        raise HTTPException(status_code=404, detail="Check not found")
        
    mv = ManualVerification(
        evaluation_check_id=checkId,
        officer_id=req.officerId,
        outcome=req.outcome,
        notes=req.notes
    )
    db.add(mv)
    
    # Update check status based on outcome
    if req.outcome == 'verified':
        check.status = 'pass'
    elif req.outcome == 'not_verified':
        check.status = 'fail'
    
    audit = AuditLog(
        bid_id=None,
        event_type='decision_submitted',
        actor_id=req.officerId,
        details={"action": "manual_verification", "check_id": str(checkId), "outcome": req.outcome}
    )
    db.add(audit)
    
    await db.commit()
    return {"status": "success"}

@router.get("/{id}/clarifications")
async def get_clarifications(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ClarificationRequest)
        .where(ClarificationRequest.bid_application_id == id)
        .order_by(ClarificationRequest.created_at.desc())
    )
    reqs = result.scalars().all()
    return [{
        "id": r.id,
        "message": r.message,
        "status": r.status,
        "createdAt": r.created_at
    } for r in reqs]
