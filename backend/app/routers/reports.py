from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Application, PartnerPerformance, ChannelPartner, Scheme, User, AdminUser
from ..auth import require_permission

router = APIRouter(prefix="/admin/reports", tags=["reports"])


@router.get("/utilization")
def scheme_utilization(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("reports:read")),
):
    """Scheme-wise utilization: how many applications reference each scheme."""
    rows = (
        db.query(Application.scheme_id, func.count(Application.id))
        .group_by(Application.scheme_id)
        .all()
    )
    counts = {r[0]: r[1] for r in rows}
    schemes = db.query(Scheme).all()
    return [
        {"scheme_id": s.scheme_id, "scheme_name": s.scheme_name, "applications": counts.get(s.scheme_id, 0)}
        for s in schemes
    ]


@router.get("/npa")
def npa_report(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("reports:read")),
):
    rows = (
        db.query(PartnerPerformance)
        .filter(PartnerPerformance.npa_pct.isnot(None))
        .order_by(PartnerPerformance.npa_pct.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "partner_ref": r.partner_ref,
            "partner_name": r.partner_name,
            "npa_pct": float(r.npa_pct),
            "overdue_accounts": r.overdue_accounts,
            "overdue_amount": float(r.overdue_amount) if r.overdue_amount is not None else None,
            "flag": r.flag,
        }
        for r in rows
    ]


@router.get("/partner-performance")
def partner_performance_report(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("reports:read")),
):
    rows = db.query(PartnerPerformance).order_by(PartnerPerformance.conversion_rate.desc()).limit(50).all()
    return [
        {
            "partner_ref": r.partner_ref,
            "partner_name": r.partner_name,
            "conversion_rate": float(r.conversion_rate) if r.conversion_rate is not None else None,
            "leads_received": r.leads_received,
            "leads_converted": r.leads_converted,
            "avg_disbursement_days": float(r.avg_disbursement_days) if r.avg_disbursement_days is not None else None,
        }
        for r in rows
    ]


@router.get("/state-reach")
def state_reach_report(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("reports:read")),
):
    rows = db.query(User.state, func.count(User.id)).group_by(User.state).all()
    return [{"state": r[0], "users": r[1]} for r in rows if r[0]]
