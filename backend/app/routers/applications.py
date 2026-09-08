from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Application, Repayment, AdminUser, User, ChannelPartner
from ..auth import require_permission

router = APIRouter(prefix="/admin/applications", tags=["applications"])


@router.get("")
def list_applications(
    status: Optional[str] = None,
    scheme_id: Optional[str] = None,
    partner_ref: Optional[int] = None,
    sla_flag: Optional[bool] = None,
    page: int = 1,
    page_size: int = 25,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("applications:read")),
):
    q = db.query(Application)
    if status:
        q = q.filter(Application.status == status)
    if scheme_id:
        q = q.filter(Application.scheme_id == scheme_id)
    if partner_ref:
        q = q.filter(Application.partner_ref == partner_ref)
    if sla_flag is not None:
        q = q.filter(Application.sla_flag == sla_flag)

    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total, "page": page, "page_size": page_size,
        "results": [_serialize(a) for a in rows],
    }


@router.get("/{application_ref}")
def get_application(
    application_ref: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("applications:read")),
):
    a = db.query(Application).filter(Application.application_ref == application_ref).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found")
    repayments = (
        db.query(Repayment)
        .filter(Repayment.application_ref == application_ref)
        .order_by(Repayment.installment_number)
        .all()
    )
    out = _serialize(a, detail=True)
    out["repayments"] = [
        {
            "installment_number": r.installment_number,
            "due_date": r.due_date,
            "amount_due": float(r.amount_due) if r.amount_due is not None else None,
            "amount_paid": float(r.amount_paid) if r.amount_paid is not None else None,
            "paid_date": r.paid_date,
            "status": r.status,
            "days_overdue": r.days_overdue,
        }
        for r in repayments
    ]
    return out


@router.patch("/{application_ref}/reassign")
def reassign_application(
    application_ref: str,
    new_partner_ref: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("applications:read")),
):
    if admin.role not in ("Super Admin", "Partner Relationship Manager"):
        raise HTTPException(status_code=403, detail="Not permitted to reassign applications")
    a = db.query(Application).filter(Application.application_ref == application_ref).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found")
    p = db.query(ChannelPartner).filter(ChannelPartner.partner_ref == new_partner_ref).first()
    if not p:
        raise HTTPException(status_code=404, detail="Target partner not found")
    a.partner_ref = new_partner_ref
    db.add(a)
    db.commit()
    return {"status": "reassigned", "application_ref": application_ref, "new_partner_ref": new_partner_ref}


def _serialize(a: Application, detail: bool = False):
    base = {
        "application_ref": a.application_ref,
        "user_ref": a.user_ref,
        "scheme_id": a.scheme_id,
        "partner_ref": a.partner_ref,
        "status": a.status,
        "loan_amount_requested": float(a.loan_amount_requested) if a.loan_amount_requested is not None else None,
        "sla_flag": a.sla_flag,
        "matched_at": a.matched_at,
    }
    if detail:
        base.update({
            "loan_amount_sanctioned": float(a.loan_amount_sanctioned) if a.loan_amount_sanctioned is not None else None,
            "emi_amount": float(a.emi_amount) if a.emi_amount is not None else None,
            "tenure_months": a.tenure_months,
            "routing_score": float(a.routing_score) if a.routing_score is not None else None,
            "applied_at": a.applied_at,
            "status_updated_at": a.status_updated_at,
        })
    return base
