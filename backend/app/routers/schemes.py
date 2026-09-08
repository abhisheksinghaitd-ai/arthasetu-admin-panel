from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Scheme, SchemeVersion, AdminUser, AuditLog
from ..schemas import SchemeCreate
from ..auth import require_permission

router = APIRouter(prefix="/admin/schemes", tags=["schemes"])


@router.get("")
def list_schemes(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("schemes:read")),
):
    q = db.query(Scheme)
    if status:
        q = q.filter(Scheme.status == status)
    rows = q.all()
    return [_serialize(s) for s in rows]


@router.get("/{scheme_id}")
def get_scheme(
    scheme_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("schemes:read")),
):
    s = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return _serialize(s, detail=True)


@router.post("")
def create_scheme(
    payload: SchemeCreate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("schemes:write")),
):
    existing = db.query(Scheme).filter(Scheme.scheme_id == payload.scheme_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Scheme ID already exists")

    s = Scheme(
        **payload.model_dump(),
        status="draft",
        version_no=1,
        created_by=admin.admin_ref,
    )
    db.add(s)
    db.flush()

    db.add(SchemeVersion(
        scheme_id=s.scheme_id, version_no=1, rules_json=payload.model_dump(),
        status="draft", edited_by=admin.admin_ref,
    ))
    db.add(AuditLog(
        log_ref=f"LOG{int(datetime.utcnow().timestamp())}",
        admin_ref=admin.admin_ref, action_type="create_scheme",
        target_type="scheme", target_id=s.scheme_id,
        reason="New scheme drafted", metadata_json={},
    ))
    db.commit()
    return _serialize(s)


@router.put("/{scheme_id}")
def update_scheme(
    scheme_id: str,
    payload: SchemeCreate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("schemes:write")),
):
    s = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found")

    for k, v in payload.model_dump().items():
        setattr(s, k, v)
    s.version_no += 1
    s.status = "draft"
    s.updated_by = admin.admin_ref
    db.add(s)

    db.add(SchemeVersion(
        scheme_id=s.scheme_id, version_no=s.version_no, rules_json=payload.model_dump(),
        status="draft", edited_by=admin.admin_ref,
    ))
    db.add(AuditLog(
        log_ref=f"LOG{int(datetime.utcnow().timestamp())}",
        admin_ref=admin.admin_ref, action_type="edit_scheme",
        target_type="scheme", target_id=scheme_id,
        reason=f"Edited to v{s.version_no}", metadata_json={},
    ))
    db.commit()
    return _serialize(s)


@router.post("/{scheme_id}/publish")
def publish_scheme(
    scheme_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("schemes:publish")),
):
    """
    Four-eyes principle (PDF 5.4): the publisher must differ from whoever
    last edited the current draft version.
    """
    s = db.query(Scheme).filter(Scheme.scheme_id == scheme_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found")

    latest_version = (
        db.query(SchemeVersion)
        .filter(SchemeVersion.scheme_id == scheme_id)
        .order_by(SchemeVersion.version_no.desc())
        .first()
    )
    if latest_version and latest_version.edited_by == admin.admin_ref and admin.role != "Super Admin":
        raise HTTPException(
            status_code=403,
            detail="Four-eyes principle: publisher must differ from editor of this draft",
        )

    s.status = "active"
    s.published_at = datetime.utcnow()
    db.add(s)

    if latest_version:
        latest_version.status = "published"
        latest_version.approved_by = admin.admin_ref
        latest_version.published_at = datetime.utcnow()
        db.add(latest_version)

    db.add(AuditLog(
        log_ref=f"LOG{int(datetime.utcnow().timestamp())}",
        admin_ref=admin.admin_ref, action_type="publish_scheme",
        target_type="scheme", target_id=scheme_id,
        reason=f"Published v{s.version_no}", metadata_json={},
    ))
    db.commit()
    return _serialize(s)


@router.get("/{scheme_id}/versions")
def scheme_versions(
    scheme_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(require_permission("schemes:read")),
):
    rows = (
        db.query(SchemeVersion)
        .filter(SchemeVersion.scheme_id == scheme_id)
        .order_by(SchemeVersion.version_no.desc())
        .all()
    )
    return [
        {
            "version_no": v.version_no,
            "status": v.status,
            "edited_by": v.edited_by,
            "approved_by": v.approved_by,
            "published_at": v.published_at,
            "created_at": v.created_at,
            "rules_json": v.rules_json,
        }
        for v in rows
    ]


def _serialize(s: Scheme, detail: bool = False):
    base = {
        "scheme_id": s.scheme_id,
        "scheme_name": s.scheme_name,
        "category": s.category,
        "status": s.status,
        "version_no": s.version_no,
    }
    if detail:
        base.update({
            "target_gender": s.target_gender,
            "max_project_cost_inr": float(s.max_project_cost_inr) if s.max_project_cost_inr is not None else None,
            "max_loan_limit_inr": float(s.max_loan_limit_inr) if s.max_loan_limit_inr is not None else None,
            "loan_percentage_cap": float(s.loan_percentage_cap) if s.loan_percentage_cap is not None else None,
            "interest_rate_male_pct": float(s.interest_rate_male_pct) if s.interest_rate_male_pct is not None else None,
            "interest_rate_female_pct": float(s.interest_rate_female_pct) if s.interest_rate_female_pct is not None else None,
            "interest_rate_conditional_logic": s.interest_rate_conditional_logic,
            "max_repayment_period_months": s.max_repayment_period_months,
            "moratorium_period": s.moratorium_period,
            "allowed_channel_partners": s.allowed_channel_partners,
            "published_at": s.published_at,
        })
    return base
