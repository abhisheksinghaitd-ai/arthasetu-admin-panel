from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Grievance, AdminUser, AuditLog
from ..schemas import GrievanceResolve
from ..auth import require_permission

router = APIRouter(prefix="/admin/grievances", tags=["grievances"])


@router.get("")
def list_grievances(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("dashboard:read")),
):
    q = db.query(Grievance)
    if status:
        q = q.filter(Grievance.status == status)
    rows = q.order_by(Grievance.created_at.desc()).all()
    return [
        {
            "grievance_ref": g.grievance_ref,
            "raised_by_type": g.raised_by_type,
            "raised_by_id": g.raised_by_id,
            "subject": g.subject,
            "description": g.description,
            "status": g.status,
            "assigned_admin_ref": g.assigned_admin_ref,
            "created_at": g.created_at,
            "resolved_at": g.resolved_at,
        }
        for g in rows
    ]


@router.patch("/{grievance_ref}/resolve")
def resolve_grievance(
    grievance_ref: str,
    payload: GrievanceResolve,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("dashboard:read")),
):
    g = db.query(Grievance).filter(Grievance.grievance_ref == grievance_ref).first()
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")
    g.status = "resolved"
    g.resolved_at = datetime.utcnow()
    db.add(g)
    db.add(AuditLog(
        log_ref=f"LOG{int(datetime.utcnow().timestamp())}",
        admin_ref=admin.admin_ref, action_type="resolve_grievance",
        target_type="grievance", target_id=grievance_ref,
        reason=payload.resolution_note or "Resolved", metadata_json={},
    ))
    db.commit()
    return {"status": "resolved", "grievance_ref": grievance_ref}
