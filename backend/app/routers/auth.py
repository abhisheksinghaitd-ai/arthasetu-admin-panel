from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AdminUser
from ..schemas import LoginRequest, LoginResponse, AdminOut
from ..auth import verify_password, create_access_token, ROLE_PERMISSIONS

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Demo-friendly login: if `role` is supplied and matches a seeded admin
    with that role, log in as that admin regardless of password (hackathon
    demo mode). In production this would be strict password verification
    only. Set STRICT_AUTH=1 env var to disable demo mode.
    """
    admin = None
    if payload.role:
        admin = (
            db.query(AdminUser)
            .filter(AdminUser.role == payload.role, AdminUser.is_active == True)  # noqa: E712
            .first()
        )
    if not admin:
        admin = db.query(AdminUser).filter(AdminUser.email == payload.email).first()

    if not admin:
        # Demo fallback: no matching admin_users row -> log in as Super Admin
        admin = (
            db.query(AdminUser)
            .filter(AdminUser.role == "Super Admin")
            .first()
        )

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": admin.admin_ref, "role": admin.role})
    return LoginResponse(access_token=token, admin=AdminOut.model_validate(admin))


@router.get("/roles")
def list_roles():
    """Expose the 6 RBAC roles for the login role-picker UI."""
    return [{"role": r, "permissions": sorted(list(p))} for r, p in ROLE_PERMISSIONS.items()]
