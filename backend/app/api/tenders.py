from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.db.models.tenders import Tender
from app.db.models.tender_rules import TenderRule
from app.db.models.bids import BidApplication
from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional
import uuid
import datetime

router = APIRouter()

class TenderCreateRequest(BaseModel):
    title: str
    organization: str
    category: str
    description: Optional[str] = None
    deadline: Optional[str] = None
    access_type: str = "public"
    closing_date: Optional[str] = None
    est_value: Optional[float] = None

@router.post("")
async def create_tender(req: TenderCreateRequest, db: AsyncSession = Depends(get_db)):
    tender_no = f"GEM/{datetime.datetime.now().year}/B/{uuid.uuid4().hex[:6].upper()}"
    
    closing_date_val = None
    if req.closing_date:
        try:
            closing_date_val = datetime.datetime.fromisoformat(req.closing_date.replace("Z", "+00:00"))
        except:
            pass

    tender = Tender(
        tender_no=tender_no,
        title=req.title,
        organization=req.organization,
        category=req.category,
        access_type=req.access_type,
        closing_date=closing_date_val,
        est_value=req.est_value,
        status='draft'
    )
    db.add(tender)
    await db.commit()
    await db.refresh(tender)
    return {"id": tender.id, "tender_no": tender.tender_no, "status": tender.status}

class TenderRuleRequest(BaseModel):
    clauseType: str
    mandatory: bool
    thresholdValue: Optional[float] = None

class TenderUpdateRequest(BaseModel):
    access_type: str
    private_password: Optional[str] = None
    closing_date: Optional[str] = None
    est_value: Optional[float] = None

@router.put("/{id}")
async def update_tender(id: uuid.UUID, req: TenderUpdateRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tender).where(Tender.id == id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    tender.access_type = req.access_type
    if req.access_type == 'private':
        tender.private_password = req.private_password
    else:
        tender.private_password = None
        
    if req.closing_date:
        try:
            tender.closing_date = datetime.datetime.fromisoformat(req.closing_date.replace("Z", "+00:00"))
        except:
            pass
    if req.est_value is not None:
        tender.est_value = req.est_value
        
    await db.commit()
    return {"status": "success", "access_type": tender.access_type}

class SetRulesRequest(BaseModel):
    rules: List[TenderRuleRequest]

@router.post("/{id}/rules")
async def set_tender_rules(id: uuid.UUID, req: SetRulesRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tender).where(Tender.id == id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    await db.execute(TenderRule.__table__.delete().where(TenderRule.tender_id == id))
    
    for r in req.rules:
        rule = TenderRule(
            tender_id=id,
            clause_type=r.clauseType,
            mandatory=r.mandatory,
            threshold_value=r.thresholdValue
        )
        db.add(rule)
        
    await db.commit()
    return {"status": "success"}

@router.post("/{id}/publish")
async def publish_tender(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tender).where(Tender.id == id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    rules_res = await db.execute(select(TenderRule).where(TenderRule.tender_id == id))
    if not rules_res.scalars().first():
        raise HTTPException(status_code=400, detail="Cannot publish tender without rules")
        
    tender.status = 'open'
    await db.commit()
    return {"status": "success"}

@router.get("")
async def get_all_tenders(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    
    # Left join with BidApplication to get count
    query = select(
        Tender,
        func.count(BidApplication.id).label('bids_count')
    ).outerjoin(BidApplication, BidApplication.tender_id == Tender.id).group_by(Tender.id)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [{
        "id": row.Tender.id,
        "tender_no": row.Tender.tender_no,
        "title": row.Tender.title,
        "organization": row.Tender.organization,
        "category": row.Tender.category,
        "status": row.Tender.status,
        "access_type": row.Tender.access_type,
        "closing_date": row.Tender.closing_date.isoformat() if row.Tender.closing_date else None,
        "est_value": float(row.Tender.est_value) if row.Tender.est_value else None,
        "bidsCount": row.bids_count
    } for row in rows]

@router.get("/{id}/applications")
async def get_tender_applications(id: uuid.UUID, status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    from app.db.models.bidders import Bidder
    query = select(BidApplication, Bidder.organization_name).join(Bidder, BidApplication.bidder_id == Bidder.id).where(BidApplication.tender_id == id)
    if status:
        query = query.where(BidApplication.status == status)
        
    result = await db.execute(query)
    apps = result.all()
    
    return [{
        "id": a[0].id,
        "bidderId": a[0].bidder_id,
        "bidderName": a[1],
        "status": a[0].status,
        "submittedAt": a[0].submitted_at
    } for a in apps]

@router.get("/open")
async def get_open_tenders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tender).where(Tender.status == 'open'))
    tenders = result.scalars().all()
    return [{
        "id": t.id,
        "tender_no": t.tender_no,
        "title": t.title,
        "organization": t.organization,
        "category": t.category,
        "access_type": t.access_type,
        "closing_date": t.closing_date.isoformat() if t.closing_date else None,
        "est_value": float(t.est_value) if t.est_value else None,
    } for t in tenders]

@router.get("/search/{tender_no:path}")
async def search_tender(tender_no: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tender).where(Tender.tender_no.ilike(tender_no)).where(Tender.status == 'open'))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found or not open for applications")
    return {
        "id": tender.id,
        "tender_no": tender.tender_no,
        "title": tender.title,
        "organization": tender.organization,
        "category": tender.category,
        "access_type": tender.access_type,
        "closing_date": tender.closing_date.isoformat() if tender.closing_date else None,
        "est_value": float(tender.est_value) if tender.est_value else None,
    }

@router.get("/{id}")
async def get_tender(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tender).where(Tender.id == id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    rules_res = await db.execute(select(TenderRule).where(TenderRule.tender_id == id))
    rules = rules_res.scalars().all()
    
    return {
        "id": tender.id,
        "tender_no": tender.tender_no,
        "title": tender.title,
        "organization": tender.organization,
        "category": tender.category,
        "status": tender.status,
        "access_type": tender.access_type,
        "private_password": tender.private_password,
        "closing_date": tender.closing_date.isoformat() if tender.closing_date else None,
        "est_value": float(tender.est_value) if tender.est_value else None,
        "rules": [{"clauseType": r.clause_type, "mandatory": r.mandatory, "threshold": r.threshold_value} for r in rules]
    }

class UnlockRequest(BaseModel):
    password: str

@router.post("/{id}/unlock")
async def unlock_tender(id: uuid.UUID, req: UnlockRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tender).where(Tender.id == id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    if tender.access_type != 'private':
        raise HTTPException(status_code=400, detail="Tender is not private")
        
    if tender.private_password != req.password:
        raise HTTPException(status_code=401, detail="Incorrect password")
        
    return {"status": "success", "message": "Unlocked"}

@router.post("/{id}/cancel")
async def cancel_tender(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tender).where(Tender.id == id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    tender.status = 'closed'
    await db.commit()
    return {"status": "success", "message": "Tender cancelled"}
