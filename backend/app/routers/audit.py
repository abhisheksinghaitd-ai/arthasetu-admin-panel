from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AuditLog, AdminUser
from ..auth import require_permission

router = APIRouter(prefix="/admin/audit-log", tags=["audit"])


@router.get("")
def list_audit_log(
    target_type: Optional[str] = None,
    admin_ref: Optional[str] = None,
    action_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("audit:read")),
):
    q = db.query(AuditLog)
    if target_type:
        q = q.filter(AuditLog.target_type == target_type)
    if admin_ref:
        q = q.filter(AuditLog.admin_ref == admin_ref)
    if action_type:
        q = q.filter(AuditLog.action_type == action_type)

    q = q.order_by(AuditLog.created_at.desc())
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total, "page": page, "page_size": page_size,
        "results": [
            {
                "log_ref": r.log_ref,
                "admin_ref": r.admin_ref,
                "action_type": r.action_type,
                "target_type": r.target_type,
                "target_id": r.target_id,
                "reason": r.reason,
                "metadata": r.metadata_json,
                "created_at": r.created_at,
            }
            for r in rows
        ],
    }
