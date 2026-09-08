from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Scheme, ChannelPartner, Application, PartnerPerformance, AdminUser
from ..auth import require_permission

router = APIRouter(prefix="/admin/dashboard", tags=["dashboard"])


@router.get("/kpis")
def kpis(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("dashboard:read")),
):
    total_users = db.query(func.count(User.id)).scalar()
    active_applications = (
        db.query(func.count(Application.id))
        .filter(Application.status.in_(["matched", "applied", "under_review"]))
        .scalar()
    )
    schemes_live = db.query(func.count(Scheme.id)).filter(Scheme.status == "active").scalar()
    partners_onboarded = db.query(func.count(ChannelPartner.id)).scalar()

    total_disbursed = (
        db.query(func.sum(PartnerPerformance.funds_disbursed)).scalar() or 0
    )
    total_overdue = (
        db.query(func.sum(PartnerPerformance.overdue_amount)).scalar() or 0
    )

    status_counts = (
        db.query(Application.status, func.count(Application.id))
        .group_by(Application.status)
        .all()
    )

    partner_type_counts = (
        db.query(ChannelPartner.type, func.count(ChannelPartner.id))
        .group_by(ChannelPartner.type)
        .all()
    )

    return {
        "total_users": total_users,
        "active_applications": active_applications,
        "schemes_live": schemes_live,
        "partners_onboarded": partners_onboarded,
        "total_disbursed": float(total_disbursed),
        "total_overdue": float(total_overdue),
        "applications_by_status": {s: c for s, c in status_counts},
        "partners_by_type": {t: c for t, c in partner_type_counts if t},
    }
