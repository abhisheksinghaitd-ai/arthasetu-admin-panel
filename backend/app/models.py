from sqlalchemy import (
    Column, Integer, String, Numeric, Text, Boolean, TIMESTAMP,
    ForeignKey, ARRAY, Date, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from .database import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True)
    admin_ref = Column(String(20), unique=True, nullable=False)  # ADM001
    name = Column(String(100))
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(String(60), nullable=False)
    state_scope = Column(String(60), nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    user_ref = Column(String(20), unique=True, nullable=False)  # USR003
    phone = Column(String(15), unique=True, nullable=False)
    name = Column(String(120), nullable=False)
    gender = Column(String(20))
    date_of_birth = Column(Date)
    state = Column(String(60))
    district = Column(String(60))
    pincode = Column(String(10))
    lat = Column(Numeric(10, 6))
    lng = Column(Numeric(10, 6))
    preferred_language = Column(String(30))
    occupation = Column(String(100))
    business_type = Column(String(100))
    category = Column(String(30))
    income_bracket = Column(String(30))
    education_level = Column(String(50))
    kyc_status = Column(String(20), default="pending")
    account_status = Column(String(20), default="active")
    blocked_reason = Column(Text)
    blocked_by = Column(String(20))
    blocked_at = Column(TIMESTAMP)
    defaulter_risk_score = Column(Numeric(5, 2), default=0)
    risk_level = Column(String(10), default="low")
    created_at = Column(TIMESTAMP, server_default=func.now())
    last_active_at = Column(TIMESTAMP)


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True)
    scheme_id = Column(String(30), unique=True, nullable=False)  # NSFDC_MCF_001
    scheme_name = Column(String(150), nullable=False)
    category = Column(String(100))
    target_gender = Column(String(20))
    max_project_cost_inr = Column(Numeric(14, 2))
    max_loan_limit_inr = Column(Numeric(14, 2))
    loan_percentage_cap = Column(Numeric(5, 2))
    interest_rate_male_pct = Column(Numeric(5, 2))
    interest_rate_female_pct = Column(Numeric(5, 2))
    interest_rate_conditional_logic = Column(Text)
    max_repayment_period_months = Column(String(60))
    moratorium_period = Column(String(60))
    allowed_channel_partners = Column(ARRAY(String))
    eligibility_rules = Column(JSONB)
    status = Column(String(20), default="draft")
    version_no = Column(Integer, default=1)
    created_by = Column(String(20))
    updated_by = Column(String(20))
    published_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())


class SchemeVersion(Base):
    __tablename__ = "scheme_versions"

    id = Column(Integer, primary_key=True)
    scheme_id = Column(String(30), ForeignKey("schemes.scheme_id"))
    version_no = Column(Integer, nullable=False)
    rules_json = Column(JSONB, nullable=False)
    status = Column(String(20))
    edited_by = Column(String(20))
    approved_by = Column(String(20))
    published_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())


class ChannelPartner(Base):
    __tablename__ = "channel_partners"

    id = Column(Integer, primary_key=True)
    partner_ref = Column(Integer, unique=True, nullable=False)  # 1..92
    corporation = Column(String(30), default="NSFDC")
    type = Column(String(30))
    name = Column(String(200), nullable=False)
    short_code = Column(String(30))
    state = Column(String(60))
    address = Column(Text)
    lat = Column(Numeric(10, 6))
    lng = Column(Numeric(10, 6))
    location_status = Column(String(60))
    active_status = Column(String(30), default="UNKNOWN")
    status = Column(String(20), default="active")  # active/suspended/blacklisted
    suspension_reason = Column(Text)
    suspended_at = Column(TIMESTAMP)
    as_of_date = Column(Date)
    amount_sanction_lakh = Column(Numeric(14, 2))
    net_disbursement_lakh = Column(Numeric(14, 2))
    funds_utilisation_lakh = Column(Numeric(14, 2))
    utilization_pct = Column(Numeric(6, 2))
    pending_utilisation_lakh = Column(Numeric(14, 2))
    cumulative_beneficiaries = Column(Integer)
    disbursement_realization_pct = Column(Numeric(6, 2))
    created_at = Column(TIMESTAMP, server_default=func.now())


class PartnerPerformance(Base):
    __tablename__ = "partner_performance"

    id = Column(Integer, primary_key=True)
    partner_ref = Column(Integer, ForeignKey("channel_partners.partner_ref"))
    period = Column(String(7))  # "2026-08"
    funds_allocated = Column(Numeric(14, 2))
    funds_disbursed = Column(Numeric(14, 2))
    funds_utilized_pct = Column(Numeric(6, 2))
    leads_received = Column(Integer)
    leads_converted = Column(Integer)
    conversion_rate = Column(Numeric(5, 2))
    overdue_accounts = Column(Integer)
    overdue_amount = Column(Numeric(14, 2))
    npa_pct = Column(Numeric(5, 2))
    overdue_30d = Column(Integer)
    overdue_60d = Column(Integer)
    overdue_90d_plus = Column(Integer)
    avg_disbursement_days = Column(Numeric(5, 1))
    flag = Column(Text)
    computed_at = Column(TIMESTAMP, server_default=func.now())


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True)
    application_ref = Column(String(20), unique=True, nullable=False)  # APP003
    user_ref = Column(String(20), ForeignKey("users.user_ref"))
    scheme_id = Column(String(30), ForeignKey("schemes.scheme_id"))
    partner_ref = Column(Integer, ForeignKey("channel_partners.partner_ref"))
    status = Column(String(30), default="matched")
    loan_amount_requested = Column(Numeric(12, 2))
    loan_amount_sanctioned = Column(Numeric(12, 2))
    emi_amount = Column(Numeric(10, 2))
    tenure_months = Column(Integer)
    routing_score = Column(Numeric(6, 4))
    sla_flag = Column(Boolean, default=False)
    matched_at = Column(TIMESTAMP, server_default=func.now())
    applied_at = Column(TIMESTAMP)
    status_updated_at = Column(TIMESTAMP, server_default=func.now())


class Repayment(Base):
    __tablename__ = "repayments"

    id = Column(Integer, primary_key=True)
    application_ref = Column(String(20), ForeignKey("applications.application_ref"))
    installment_number = Column(Integer)
    due_date = Column(Date)
    amount_due = Column(Numeric(10, 2))
    amount_paid = Column(Numeric(10, 2), default=0)
    paid_date = Column(Date)
    status = Column(String(20), default="pending")
    days_overdue = Column(Integer, default=0)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True)
    log_ref = Column(String(20), unique=True)  # LOG001
    admin_ref = Column(String(20), ForeignKey("admin_users.admin_ref"))
    action_type = Column(String(60))
    target_type = Column(String(40))
    target_id = Column(String(30))
    reason = Column(Text)
    metadata_json = Column(JSONB)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(Integer, primary_key=True)
    grievance_ref = Column(String(20), unique=True)
    raised_by_type = Column(String(20))
    raised_by_id = Column(String(30))
    subject = Column(String(150))
    description = Column(Text)
    status = Column(String(20), default="open")
    assigned_admin_ref = Column(String(20), ForeignKey("admin_users.admin_ref"))
    resolved_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    recipient_type = Column(String(20))
    recipient_id = Column(String(30))
    message = Column(Text)
    channel = Column(String(20))
    sent_at = Column(TIMESTAMP, server_default=func.now())
    read_at = Column(TIMESTAMP)
