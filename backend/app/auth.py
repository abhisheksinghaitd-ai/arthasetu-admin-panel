import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db
from .models import AdminUser, User

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-in-production-arthasetu")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# ---------------------------------------------------------------
# RBAC permission matrix (PDF Section 3)
# ---------------------------------------------------------------
ROLE_PERMISSIONS = {
    "Super Admin": {"*"},
    "Scheme Manager": {
        "schemes:read", "schemes:write", "schemes:publish",
        "dashboard:read", "applications:read", "reports:read",
    },
    "Partner Relationship Manager": {
        "partners:read", "partners:write", "partners:suspend",
        "dashboard:read", "applications:read", "reports:read",
    },
    "Compliance / Auditor": {
        "dashboard:read", "users:read", "partners:read", "schemes:read",
        "applications:read", "reports:read", "reports:export",
        "audit:read", "grievances:read",
    },
    "State/Regional Officer": {
        "dashboard:read", "users:read", "partners:read", "schemes:read",
        "applications:read", "reports:read",
    },
    "Support Staff": {
        "dashboard:read", "users:read", "applications:read",
    },
}


def has_permission(role: str, perm: str) -> bool:
    perms = ROLE_PERMISSIONS.get(role, set())
    return "*" in perms or perm in perms


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_admin(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(token)
    admin_ref = payload.get("sub")
    admin = db.query(AdminUser).filter(AdminUser.admin_ref == admin_ref).first()
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="Admin not found or inactive")
    return admin


def create_beneficiary_token(user_ref: str, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES * 24) -> str:
    return create_access_token({"sub": user_ref, "typ": "beneficiary"}, expires_minutes=expires_minutes)


def get_current_beneficiary(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(token)
    if payload.get("typ") != "beneficiary":
        raise HTTPException(status_code=401, detail="Not a beneficiary token")
    user_ref = payload.get("sub")
    user = db.query(User).filter(User.user_ref == user_ref).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_permission(perm: str):
    def _checker(admin: AdminUser = Depends(get_current_admin)):
        if not has_permission(admin.role, perm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{admin.role}' lacks permission '{perm}'",
            )
        return admin
    return _checker
