from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, AdminUser, AuditLog
from ..schemas import BlockRequest
from ..auth import require_permission

router = APIRouter(prefix="/admin/users", tags=["users"])


@router.get("")
def list_users(
    state: Optional[str] = None,
    account_status: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 25,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("users:read")),
):
    q = db.query(User)
    if state:
        q = q.filter(User.state == state)
    if account_status:
        q = q.filter(User.account_status == account_status)
    if risk_level:
        q = q.filter(User.risk_level == risk_level)
    if search:
        needle = f"%{search}%"
        q = q.filter((User.name.ilike(needle)) | (User.phone.ilike(needle)) | (User.user_ref.ilike(needle)))

    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total, "page": page, "page_size": page_size,
        "results": [_serialize(u) for u in rows],
    }


@router.get("/{user_ref}")
def get_user(
    user_ref: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("users:read")),
):
    u = db.query(User).filter(User.user_ref == user_ref).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return _serialize(u, detail=True)


@router.patch("/{user_ref}/block")
def block_user(
    user_ref: str,
    payload: BlockRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("users:read")),
):
    if admin.role == "Support Staff":
        raise HTTPException(status_code=403, detail="Support Staff cannot block/unblock users")

    u = db.query(User).filter(User.user_ref == user_ref).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.account_status = "blocked"
    u.blocked_reason = payload.reason
    u.blocked_by = admin.admin_ref
    u.blocked_at = datetime.utcnow()
    db.add(u)

    db.add(AuditLog(
        log_ref=f"LOG{int(datetime.utcnow().timestamp())}",
        admin_ref=admin.admin_ref,
        action_type="block_user",
        target_type="user",
        target_id=user_ref,
        reason=payload.reason,
        metadata_json={},
    ))
    db.commit()
    return {"status": "blocked", "user_ref": user_ref}


@router.patch("/{user_ref}/unblock")
def unblock_user(
    user_ref: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("users:read")),
):
    u = db.query(User).filter(User.user_ref == user_ref).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.account_status = "active"
    u.blocked_reason = None
    u.blocked_by = None
    u.blocked_at = None
    db.add(u)

    db.add(AuditLog(
        log_ref=f"LOG{int(datetime.utcnow().timestamp())}",
        admin_ref=admin.admin_ref,
        action_type="unblock_user",
        target_type="user",
        target_id=user_ref,
        reason="Manual unblock",
        metadata_json={},
    ))
    db.commit()
    return {"status": "active", "user_ref": user_ref}


def _serialize(u: User, detail: bool = False):
    base = {
        "user_ref": u.user_ref,
        "phone": u.phone,
        "name": u.name,
        "gender": u.gender,
        "state": u.state,
        "district": u.district,
        "kyc_status": u.kyc_status,
        "account_status": u.account_status,
        "defaulter_risk_score": float(u.defaulter_risk_score) if u.defaulter_risk_score is not None else None,
        "risk_level": u.risk_level,
        "blocked_reason": u.blocked_reason,
        "created_at": u.created_at,
    }
    if detail:
        base.update({
            "pincode": u.pincode,
            "preferred_language": u.preferred_language,
            "occupation": u.occupation,
            "business_type": u.business_type,
            "category": u.category,
            "income_bracket": u.income_bracket,
            "education_level": u.education_level,
            "blocked_by": u.blocked_by,
            "blocked_at": u.blocked_at,
            "last_active_at": u.last_active_at,
        })
    return base
