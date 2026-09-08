from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ChannelPartner, PartnerPerformance, AdminUser, AuditLog, Application
from ..schemas import SuspendRequest
from ..auth import require_permission

router = APIRouter(prefix="/admin/partners", tags=["partners"])


@router.get("")
def list_partners(
    type: Optional[str] = None,
    state: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 25,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("partners:read")),
):
    q = db.query(ChannelPartner)
    if type:
        q = q.filter(ChannelPartner.type == type)
    if state:
        q = q.filter(ChannelPartner.state == state)
    if status:
        q = q.filter(ChannelPartner.status == status)
    if search:
        q = q.filter(ChannelPartner.name.ilike(f"%{search}%"))

    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total, "page": page, "page_size": page_size,
        "results": [_serialize(p) for p in rows],
    }


@router.get("/types")
def list_partner_types(db: Session = Depends(get_db), admin: AdminUser = Depends(require_permission("partners:read"))):
    rows = db.query(ChannelPartner.type).distinct().all()
    return sorted([r[0] for r in rows if r[0]])


@router.get("/{partner_ref}")
def get_partner(
    partner_ref: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("partners:read")),
):
    p = db.query(ChannelPartner).filter(ChannelPartner.partner_ref == partner_ref).first()
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")
    return _serialize(p, detail=True)


@router.get("/{partner_ref}/performance")
def get_partner_performance(
    partner_ref: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("partners:read")),
):
    rows = (
        db.query(PartnerPerformance)
        .filter(PartnerPerformance.partner_ref == partner_ref)
        .order_by(PartnerPerformance.period.desc())
        .all()
    )
    return [
        {
            "period": r.period,
            "funds_allocated": float(r.funds_allocated) if r.funds_allocated is not None else None,
            "funds_disbursed": float(r.funds_disbursed) if r.funds_disbursed is not None else None,
            "funds_utilized_pct": float(r.funds_utilized_pct) if r.funds_utilized_pct is not None else None,
            "leads_received": r.leads_received,
            "leads_converted": r.leads_converted,
            "conversion_rate": float(r.conversion_rate) if r.conversion_rate is not None else None,
            "overdue_accounts": r.overdue_accounts,
            "overdue_amount": float(r.overdue_amount) if r.overdue_amount is not None else None,
            "npa_pct": float(r.npa_pct) if r.npa_pct is not None else None,
            "overdue_30d": r.overdue_30d,
            "overdue_60d": r.overdue_60d,
            "overdue_90d_plus": r.overdue_90d_plus,
            "avg_disbursement_days": float(r.avg_disbursement_days) if r.avg_disbursement_days is not None else None,
            "flag": r.flag,
        }
        for r in rows
    ]


@router.patch("/{partner_ref}/suspend")
def suspend_partner(
    partner_ref: int,
    payload: SuspendRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("partners:suspend")),
):
    p = db.query(ChannelPartner).filter(ChannelPartner.partner_ref == partner_ref).first()
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")

    p.status = "suspended"
    p.suspension_reason = payload.reason
    p.suspended_at = datetime.utcnow()
    db.add(p)

    db.add(AuditLog(
        log_ref=f"LOG{int(datetime.utcnow().timestamp())}",
        admin_ref=admin.admin_ref,
        action_type="suspend_partner",
        target_type="partner",
        target_id=str(partner_ref),
        reason=payload.reason,
        metadata_json={"partner_name": p.name},
    ))
    db.commit()
    return {"status": "suspended", "partner_ref": partner_ref}


@router.patch("/{partner_ref}/reinstate")
def reinstate_partner(
    partner_ref: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("partners:suspend")),
):
    p = db.query(ChannelPartner).filter(ChannelPartner.partner_ref == partner_ref).first()
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")
    p.status = "active"
    p.suspension_reason = None
    p.suspended_at = None
    db.add(p)
    db.add(AuditLog(
        log_ref=f"LOG{int(datetime.utcnow().timestamp())}",
        admin_ref=admin.admin_ref,
        action_type="reinstate_partner",
        target_type="partner",
        target_id=str(partner_ref),
        reason="Manual reinstatement",
        metadata_json={},
    ))
    db.commit()
    return {"status": "active", "partner_ref": partner_ref}


@router.get("/{partner_ref}/suspension-impact")
def suspension_impact(
    partner_ref: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("partners:read")),
):
    """PDF Section 6: preview how many pending applications would be affected."""
    pending_statuses = ["matched", "applied", "under_review"]
    count = (
        db.query(Application)
        .filter(Application.partner_ref == partner_ref, Application.status.in_(pending_statuses))
        .count()
    )
    p = db.query(ChannelPartner).filter(ChannelPartner.partner_ref == partner_ref).first()
    return {
        "partner_ref": partner_ref,
        "partner_name": p.name if p else None,
        "state": p.state if p else None,
        "pending_applications_affected": count,
    }


def _serialize(p: ChannelPartner, detail: bool = False):
    base = {
        "partner_ref": p.partner_ref,
        "name": p.name,
        "type": p.type,
        "state": p.state,
        "status": p.status,
        "active_status": p.active_status,
        "utilization_pct": float(p.utilization_pct) if p.utilization_pct is not None else None,
        "cumulative_beneficiaries": p.cumulative_beneficiaries,
    }
    if detail:
        base.update({
            "corporation": p.corporation,
            "short_code": p.short_code,
            "address": p.address,
            "lat": float(p.lat) if p.lat is not None else None,
            "lng": float(p.lng) if p.lng is not None else None,
            "location_status": p.location_status,
            "suspension_reason": p.suspension_reason,
            "suspended_at": p.suspended_at,
            "as_of_date": p.as_of_date,
            "amount_sanction_lakh": float(p.amount_sanction_lakh) if p.amount_sanction_lakh is not None else None,
            "net_disbursement_lakh": float(p.net_disbursement_lakh) if p.net_disbursement_lakh is not None else None,
            "pending_utilisation_lakh": float(p.pending_utilisation_lakh) if p.pending_utilisation_lakh is not None else None,
            "disbursement_realization_pct": float(p.disbursement_realization_pct) if p.disbursement_realization_pct is not None else None,
        })
    return base
