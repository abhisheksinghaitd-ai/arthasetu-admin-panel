from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime, date


# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None  # allow choosing a demo role at login


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: "AdminOut"


class AdminOut(BaseModel):
    admin_ref: str
    name: str
    email: str
    role: str
    state_scope: Optional[str] = None
    mfa_enabled: bool

    class Config:
        from_attributes = True


# ---------- Users ----------
class BlockRequest(BaseModel):
    reason: str


class UserOut(BaseModel):
    user_ref: str
    phone: str
    name: str
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    kyc_status: Optional[str] = None
    account_status: str
    defaulter_risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    blocked_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- Partners ----------
class SuspendRequest(BaseModel):
    reason: str


class PartnerOut(BaseModel):
    partner_ref: int
    name: str
    type: Optional[str] = None
    state: Optional[str] = None
    status: str
    active_status: Optional[str] = None
    utilization_pct: Optional[float] = None
    cumulative_beneficiaries: Optional[int] = None

    class Config:
        from_attributes = True


# ---------- Schemes ----------
class SchemeCreate(BaseModel):
    scheme_id: str
    scheme_name: str
    category: Optional[str] = None
    target_gender: Optional[str] = None
    max_project_cost_inr: Optional[float] = None
    max_loan_limit_inr: Optional[float] = None
    loan_percentage_cap: Optional[float] = None
    interest_rate_male_pct: Optional[float] = None
    interest_rate_female_pct: Optional[float] = None
    interest_rate_conditional_logic: Optional[str] = None
    max_repayment_period_months: Optional[str] = None
    moratorium_period: Optional[str] = None
    allowed_channel_partners: List[str] = []


class SchemeOut(BaseModel):
    scheme_id: str
    scheme_name: str
    category: Optional[str] = None
    status: str
    version_no: int

    class Config:
        from_attributes = True


# ---------- Grievances ----------
class GrievanceResolve(BaseModel):
    resolution_note: Optional[str] = None


class GrievanceCreateRequest(BaseModel):
    subject: str
    description: str


# ---------- Public (beneficiary app) ----------
class BeneficiaryRegisterRequest(BaseModel):
    phone: str
    name: str
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    preferred_language: Optional[str] = None
    occupation: Optional[str] = None
    business_type: Optional[str] = None
    category: Optional[str] = None
    income_bracket: Optional[str] = None
    education_level: Optional[str] = None


class BeneficiaryOut(BaseModel):
    user_ref: str
    phone: str
    name: str
    account_status: str

    class Config:
        from_attributes = True


class BeneficiaryRegisterResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: BeneficiaryOut


class ApplicationCreateRequest(BaseModel):
    scheme_id: str
    partner_ref: int
    loan_amount_requested: Optional[float] = None


class MatchRuleResult(BaseModel):
    statement: str
    clause: str
    passed: bool


class MatchDecisionCreateRequest(BaseModel):
    scheme_id: str
    matched: bool
    rules: List[MatchRuleResult]


# ---------- Saathi chat ----------
class ChatSchemeContext(BaseModel):
    name: str
    overview: str
    keyBenefits: List[str]
    eligibilityList: List[str]
    howToApply: List[str]
    rate: str
    tenure: str


class ChatEligibilityContext(BaseModel):
    matched: bool
    rules: List[MatchRuleResult]


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    scheme: Optional[ChatSchemeContext] = None
    eligibility: Optional[ChatEligibilityContext] = None
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
