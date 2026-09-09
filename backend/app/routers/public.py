import os
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, ChannelPartner, Application, Grievance, AuditLog
from ..schemas import (
    BeneficiaryRegisterRequest,
    BeneficiaryRegisterResponse,
    ApplicationCreateRequest,
    GrievanceCreateRequest,
    MatchDecisionCreateRequest,
    ChatRequest,
    ChatResponse,
)
from ..auth import create_beneficiary_token, get_current_beneficiary

router = APIRouter(prefix="/public", tags=["public"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def build_saathi_system_prompt(payload: ChatRequest) -> str:
    lines = [
        "You are Saathi, a warm, patient assistant inside the ArthaSetu app, "
        "helping Scheduled Caste entrepreneurs and students in India understand "
        "NSFDC government loan schemes.",
        "Your users are often first-generation entrepreneurs or students with "
        "little formal education, so explain things the way you'd explain them "
        "to someone who has never dealt with banks, loans, or government forms "
        "before. Use short sentences and everyday words. Never use financial, "
        "legal, or bureaucratic jargon (like 'collateral', 'moratorium', "
        "'disbursement', 'subsidy component') without immediately explaining it "
        "in plain words in the same sentence. Prefer concrete numbers and "
        "examples over abstract descriptions. Be warm and encouraging, never "
        "condescending.",
        "Never suggest uploading documents, certificates, or photos, and never "
        "mention WhatsApp or any third-party app — this app does not support that.",
        "If a question falls outside NSFDC schemes or this app, gently redirect "
        "the user back to what you can help with.",
        "You are replying inside a narrow mobile chat bubble. Use short paragraphs "
        "and simple markdown (headings, bold, bullet lists) freely, but avoid "
        "markdown tables — they don't fit a narrow chat bubble well. When you'd "
        "normally reach for a table, use a short bulleted list instead, one "
        "point per line.",
    ]

    if payload.scheme:
        s = payload.scheme
        lines.append(
            "\nHere is the VERIFIED information about the scheme the user is asking "
            "about. Never contradict it or invent numbers, rates, or rules beyond it:\n"
            f"Scheme name: {s.name}\n"
            f"Overview: {s.overview}\n"
            f"Published eligibility criteria: {'; '.join(s.eligibilityList)}\n"
            f"Key benefits: {'; '.join(s.keyBenefits)}\n"
            f"How to apply: {'; '.join(s.howToApply)}\n"
            f"Interest rate: {s.rate}\n"
            f"Repayment tenure: {s.tenure}"
        )

    if payload.eligibility:
        e = payload.eligibility
        rule_lines = "\n".join(
            f"- {r.statement} ({r.clause}): {'PASSED' if r.passed else 'NOT MET'}"
            for r in e.rules
        )
        lines.append(
            "\nThis user's personal eligibility for this scheme has ALREADY been "
            "checked by our rule engine. Never recompute it or state a different "
            f"verdict — just explain it if asked:\n"
            f"Overall result: {'ELIGIBLE' if e.matched else 'NOT ELIGIBLE'}\n"
            f"{rule_lines}"
        )

    return "\n".join(lines)


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Chat is not configured")

    messages = [{"role": "system", "content": build_saathi_system_prompt(payload)}]
    messages.extend({"role": m.role, "content": m.content} for m in payload.history)
    messages.append({"role": "user", "content": payload.message})

    try:
        resp = httpx.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": 0.4,
                "max_tokens": 1024,
            },
            timeout=20.0,
        )
    except httpx.RequestError as exc:
        print(f"[saathi-chat] request to Groq failed: {exc!r}")
        raise HTTPException(status_code=502, detail="Saathi is unavailable right now, please try again")

    if resp.status_code >= 400:
        print(f"[saathi-chat] Groq returned {resp.status_code}: {resp.text}")
        raise HTTPException(status_code=502, detail=f"Saathi backend error ({resp.status_code}): {resp.text}")

    data = resp.json()
    reply = data["choices"][0]["message"]["content"].strip()
    return {"reply": reply}


@router.post("/register", response_model=BeneficiaryRegisterResponse)
def register(payload: BeneficiaryRegisterRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == payload.phone).first()
    if not user:
        user = User(
            user_ref=payload.phone,  # temporary placeholder, unique via the phone column; replaced below
            phone=payload.phone,
            name=payload.name,
            gender=payload.gender,
            state=payload.state,
            district=payload.district,
            pincode=payload.pincode,
            preferred_language=payload.preferred_language,
            occupation=payload.occupation,
            business_type=payload.business_type,
            category=payload.category,
            income_bracket=payload.income_bracket,
            education_level=payload.education_level,
            kyc_status="pending",
            account_status="active",
        )
        db.add(user)
        db.flush()
        user.user_ref = f"USR{user.id:04d}"
        db.commit()
        db.refresh(user)
    else:
        user.name = payload.name
        user.gender = payload.gender or user.gender
        user.state = payload.state or user.state
        user.district = payload.district or user.district
        user.pincode = payload.pincode or user.pincode
        user.preferred_language = payload.preferred_language or user.preferred_language
        user.occupation = payload.occupation or user.occupation
        user.business_type = payload.business_type or user.business_type
        user.category = payload.category or user.category
        user.income_bracket = payload.income_bracket or user.income_bracket
        user.education_level = payload.education_level or user.education_level
        user.last_active_at = datetime.utcnow()
        db.add(user)
        db.commit()
        db.refresh(user)

    if user.account_status == "blocked":
        raise HTTPException(status_code=403, detail="This account has been blocked")

    token = create_beneficiary_token(user.user_ref)
    return {"access_token": token, "user": user}


@router.get("/partners")
def list_active_partners(state: str = None, db: Session = Depends(get_db)):
    q = db.query(ChannelPartner).filter(ChannelPartner.status == "active")
    if state:
        q = q.filter(ChannelPartner.state == state)
    rows = q.all()
    return [
        {
            "partner_ref": p.partner_ref,
            "name": p.name,
            "type": p.type,
            "state": p.state,
            "address": p.address,
            "corporation": p.corporation,
        }
        for p in rows
    ]


@router.get("/scheme-stats")
def scheme_stats(db: Session = Depends(get_db)):
    """Real application counts per scheme — no PII, just an aggregate count,
    so it's safe to expose without auth. Used to show a genuine 'X people
    have applied for this scheme through ArthaSetu' figure instead of a
    made-up impact number."""
    rows = (
        db.query(Application.scheme_id, func.count(Application.id))
        .group_by(Application.scheme_id)
        .all()
    )
    return {scheme_id: count for scheme_id, count in rows}


@router.post("/applications")
def create_application(
    payload: ApplicationCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_beneficiary),
):
    partner = db.query(ChannelPartner).filter(
        ChannelPartner.partner_ref == payload.partner_ref,
        ChannelPartner.status == "active",
    ).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found or not active")

    application_ref = f"APP{int(datetime.utcnow().timestamp() * 1000)}"
    app_row = Application(
        application_ref=application_ref,
        user_ref=user.user_ref,
        scheme_id=payload.scheme_id,
        partner_ref=payload.partner_ref,
        status="applied",
        loan_amount_requested=payload.loan_amount_requested,
        applied_at=datetime.utcnow(),
    )
    db.add(app_row)
    db.commit()
    return {
        "application_ref": application_ref,
        "status": "applied",
        "scheme_id": payload.scheme_id,
        "partner_ref": payload.partner_ref,
    }


@router.get("/applications/mine")
def list_my_applications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_beneficiary),
):
    rows = (
        db.query(Application)
        .filter(Application.user_ref == user.user_ref)
        .order_by(Application.matched_at.desc())
        .all()
    )
    return [
        {
            "application_ref": a.application_ref,
            "scheme_id": a.scheme_id,
            "partner_ref": a.partner_ref,
            "status": a.status,
            "loan_amount_requested": float(a.loan_amount_requested) if a.loan_amount_requested is not None else None,
            "loan_amount_sanctioned": float(a.loan_amount_sanctioned) if a.loan_amount_sanctioned is not None else None,
            "emi_amount": float(a.emi_amount) if a.emi_amount is not None else None,
            "applied_at": a.applied_at,
            "status_updated_at": a.status_updated_at,
        }
        for a in rows
    ]


@router.post("/audit/match-decision")
def submit_match_decision(
    payload: MatchDecisionCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_beneficiary),
):
    db.add(AuditLog(
        log_ref=f"LOG{int(datetime.utcnow().timestamp() * 1000)}",
        admin_ref=None,
        action_type="scheme_match_shown",
        target_type="scheme_match",
        target_id=f"{user.user_ref}:{payload.scheme_id}",
        reason="Matched" if payload.matched else "Not matched",
        metadata_json={
            "scheme_id": payload.scheme_id,
            "matched": payload.matched,
            "rules": [r.model_dump() for r in payload.rules],
        },
    ))
    db.commit()
    return {"status": "logged"}


@router.post("/grievances")
def submit_grievance(
    payload: GrievanceCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_beneficiary),
):
    grievance_ref = f"GRV{int(datetime.utcnow().timestamp() * 1000)}"
    db.add(Grievance(
        grievance_ref=grievance_ref,
        raised_by_type="user",
        raised_by_id=user.user_ref,
        subject=payload.subject,
        description=payload.description,
        status="open",
    ))
    db.commit()
    return {"grievance_ref": grievance_ref, "status": "open"}
