"""
Seed script for ArthaSetu Admin Panel.

Reads seed_data/*.json (real NSFDC scheme + partner data, plus demo
users/applications/admin data) and loads it into PostgreSQL.

Usage:
    python seed_db.py            # creates tables if missing, then seeds
    python seed_db.py --reset    # drops and recreates all tables first
"""
import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from app.database import Base, engine, SessionLocal  # noqa: E402
from app import models as m  # noqa: E402
from app.auth import hash_password  # noqa: E402

SEED_DIR = os.path.join(os.path.dirname(__file__), "seed_data")


def load(fname):
    path = os.path.join(SEED_DIR, fname)
    with open(path, "r") as f:
        return json.load(f)


def parse_dt(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def parse_date(s):
    dt = parse_dt(s) if s and "T" in str(s) else None
    if dt:
        return dt.date()
    try:
        return datetime.strptime(s, "%Y-%m-%d").date() if s else None
    except Exception:
        return None


def seed_admin_users(db, data):
    print(f"Seeding {len(data)} admin_users...")
    for a in data:
        db.merge(m.AdminUser(
            admin_ref=a["admin_id"],
            name=a["name"],
            email=a["email"],
            password_hash=hash_password("demo-password"),  # demo only; rotate in prod
            role=a["role"],
            state_scope=a.get("state_scope"),
            mfa_enabled=a.get("mfa_enabled", False),
            is_active=True,
        ))
    db.commit()


def seed_schemes(db, data):
    print(f"Seeding {len(data)} schemes...")
    for s in data:
        db.merge(m.Scheme(
            scheme_id=s["scheme_id"],
            scheme_name=s["scheme_name"],
            category=s.get("category"),
            target_gender=s.get("target_gender"),
            max_project_cost_inr=s.get("max_project_cost_inr"),
            max_loan_limit_inr=s.get("max_loan_limit_inr"),
            loan_percentage_cap=s.get("loan_percentage_cap"),
            interest_rate_male_pct=s.get("interest_rate_male_pct"),
            interest_rate_female_pct=s.get("interest_rate_female_pct"),
            interest_rate_conditional_logic=s.get("interest_rate_conditional_logic"),
            max_repayment_period_months=str(s.get("max_repayment_period_months") or ""),
            moratorium_period=str(s.get("moratorium_period") or ""),
            allowed_channel_partners=s.get("allowed_channel_partners", []),
            status=s.get("status", "active"),
            version_no=s.get("version_no", 1),
        ))
    db.commit()


def seed_partners(db, data):
    print(f"Seeding {len(data)} channel_partners...")
    for p in data:
        loc = p.get("location") or {}
        db.merge(m.ChannelPartner(
            partner_ref=p["partner_id"],
            corporation=p.get("corporation", "NSFDC"),
            type=p.get("type"),
            name=p["name"],
            short_code=p.get("short_code"),
            state=p.get("state"),
            address=p.get("address"),
            lat=loc.get("lat"),
            lng=loc.get("lng"),
            location_status=p.get("location_status"),
            active_status=p.get("active_status", "UNKNOWN"),
            status=p.get("status", "active"),
            as_of_date=parse_date(p.get("as_of_date")),
            amount_sanction_lakh=p.get("amount_sanction_lakh"),
            net_disbursement_lakh=p.get("net_disbursement_lakh"),
            funds_utilisation_lakh=p.get("funds_utilisation_lakh"),
            utilization_pct=p.get("utilization_pct"),
            pending_utilisation_lakh=p.get("pending_utilisation_lakh"),
            cumulative_beneficiaries=p.get("cumulative_beneficiaries"),
            disbursement_realization_pct=p.get("disbursement_realization_pct"),
        ))
    db.commit()


def seed_bank_branches(db, data):
    print(f"Seeding {len(data)} bank_branches...")
    for r in data:
        db.add(m.BankBranch(
            ifsc=r["ifsc"],
            bank_name=r["bank_name"],
            bank_code=r.get("bank_code"),
            branch=r.get("branch"),
            address=r.get("address"),
            city=r.get("city"),
            district=r.get("district"),
            state=r.get("state"),
            lat=r.get("lat"),
            lng=r.get("lng"),
            geocode_source=r.get("geocode_source"),
            micr=r.get("micr"),
            contact=r.get("contact"),
            data_source=r.get("source"),
        ))
    db.commit()


def seed_partner_performance(db, data):
    print(f"Seeding {len(data)} partner_performance rows...")
    for r in data:
        db.add(m.PartnerPerformance(
            partner_ref=r["partner_id"],
            period=r["period"],
            funds_allocated=r.get("funds_allocated"),
            funds_disbursed=r.get("funds_disbursed"),
            funds_utilized_pct=r.get("funds_utilized_pct"),
            leads_received=r.get("leads_received"),
            leads_converted=r.get("leads_converted"),
            conversion_rate=r.get("conversion_rate"),
            overdue_accounts=r.get("overdue_accounts"),
            overdue_amount=r.get("overdue_amount"),
            npa_pct=r.get("npa_pct"),
            overdue_30d=r.get("overdue_30d"),
            overdue_60d=r.get("overdue_60d"),
            overdue_90d_plus=r.get("overdue_90d_plus"),
            avg_disbursement_days=r.get("avg_disbursement_days"),
            flag=r.get("flag"),
        ))
    db.commit()


def seed_users(db, data):
    print(f"Seeding {len(data)} users...")
    for u in data:
        loc = u.get("location") or {}
        db.merge(m.User(
            user_ref=u["user_id"],
            phone=u["phone"],
            name=u["name"],
            gender=u.get("gender"),
            date_of_birth=parse_date(u.get("date_of_birth")),
            state=u.get("state"),
            district=u.get("district"),
            pincode=u.get("pincode"),
            lat=loc.get("lat"),
            lng=loc.get("lng"),
            preferred_language=u.get("preferred_language"),
            occupation=u.get("occupation"),
            business_type=u.get("business_type"),
            category=u.get("category"),
            income_bracket=u.get("income_bracket"),
            education_level=u.get("education_level"),
            kyc_status=u.get("kyc_status", "pending"),
            account_status=u.get("account_status", "active"),
            blocked_reason=u.get("blocked_reason"),
            blocked_by=u.get("blocked_by"),
            blocked_at=parse_dt(u.get("blocked_at")),
            defaulter_risk_score=u.get("defaulter_risk_score", 0),
            risk_level=u.get("risk_level", "low"),
            last_active_at=parse_dt(u.get("last_active_at")),
        ))
    db.commit()


def seed_applications(db, data):
    apps = data["applications"]
    repayments = data["repayments"]
    print(f"Seeding {len(apps)} applications...")
    for a in apps:
        db.merge(m.Application(
            application_ref=a["application_id"],
            user_ref=a["user_id"],
            scheme_id=a["scheme_id"],
            partner_ref=a["partner_id"],
            status=a.get("status", "matched"),
            loan_amount_requested=a.get("loan_amount_requested"),
            loan_amount_sanctioned=a.get("loan_amount_sanctioned"),
            emi_amount=a.get("emi_amount"),
            tenure_months=a.get("tenure_months"),
            routing_score=a.get("routing_score"),
            sla_flag=a.get("sla_flag", False),
            matched_at=parse_dt(a.get("matched_at")) or datetime.utcnow(),
            applied_at=parse_dt(a.get("applied_at")),
            status_updated_at=parse_dt(a.get("status_updated_at")) or datetime.utcnow(),
        ))
    db.commit()

    print(f"Seeding {len(repayments)} repayments...")
    for r in repayments:
        db.add(m.Repayment(
            application_ref=r["application_id"],
            installment_number=r["installment_number"],
            due_date=parse_date(r.get("due_date")),
            amount_due=r.get("amount_due"),
            amount_paid=r.get("amount_paid", 0),
            paid_date=parse_date(r.get("paid_date")),
            status=r.get("status", "pending"),
            days_overdue=r.get("days_overdue", 0),
        ))
    db.commit()


def seed_admin_ops(db, data):
    audit_log = data["audit_log"]
    grievances = data["grievances"]
    notifications = data["notifications"]

    print(f"Seeding {len(audit_log)} audit_log rows...")
    for l in audit_log:
        db.merge(m.AuditLog(
            log_ref=l["log_id"],
            admin_ref=l["admin_id"],
            action_type=l["action_type"],
            target_type=l["target_type"],
            target_id=l["target_id"],
            reason=l.get("reason"),
            metadata_json=l.get("metadata", {}),
            created_at=parse_dt(l.get("created_at")) or datetime.utcnow(),
        ))
    db.commit()

    print(f"Seeding {len(grievances)} grievances...")
    for g in grievances:
        db.merge(m.Grievance(
            grievance_ref=g["grievance_id"],
            raised_by_type=g["raised_by_type"],
            raised_by_id=g["raised_by_id"],
            subject=g.get("subject"),
            description=g.get("description"),
            status=g.get("status", "open"),
            assigned_admin_ref=g.get("assigned_admin_id"),
            resolved_at=parse_dt(g.get("resolved_at")),
            created_at=parse_dt(g.get("created_at")) or datetime.utcnow(),
        ))
    db.commit()

    print(f"Seeding {len(notifications)} notifications...")
    for n in notifications:
        db.add(m.Notification(
            recipient_type=n["recipient_type"],
            recipient_id=n["recipient_id"],
            message=n["message"],
            channel=n.get("channel"),
            sent_at=parse_dt(n.get("sent_at")) or datetime.utcnow(),
            read_at=parse_dt(n.get("read_at")),
        ))
    db.commit()


def main():
    reset = "--reset" in sys.argv
    only_bank_branches = "--only-bank-branches" in sys.argv

    if reset:
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)

    print("Creating tables (if not exist)...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if only_bank_branches:
            # Backfills just the new bank_branches table on an already-seeded
            # database, without touching (or requiring a --reset wipe of)
            # anything else.
            if db.query(m.BankBranch).first() is not None:
                print("bank_branches already has data — skipping (drop the table manually to force a reseed).")
                return
            seed_bank_branches(db, load("bank_branches_up.json"))
            print("\nbank_branches seed complete.")
            return

        if not reset and db.query(m.AdminUser).first() is not None:
            # This script now runs on every container start (baked into the
            # Dockerfile CMD), including free-tier idle-spin-down restarts.
            # Several seed_* functions below use plain db.add() rather than
            # merge(), so re-running them against an already-seeded database
            # would duplicate rows on every restart. Pass --reset to force a
            # full reseed instead.
            print("Database already seeded — skipping (pass --reset to force a full reseed).")
            return

        # Order matters: admin_users and schemes/partners before rows that FK to them.
        seed_admin_users(db, load("admin_and_ops.json")["admin_users"])
        seed_schemes(db, load("schemes.json"))
        seed_partners(db, load("channel_partners.json"))
        seed_bank_branches(db, load("bank_branches_up.json"))
        seed_partner_performance(db, load("partner_performance.json"))
        seed_users(db, load("users.json"))
        seed_applications(db, load("applications.json"))
        seed_admin_ops(db, load("admin_and_ops.json"))
        print("\nSeed complete.")
        print("Demo admin logins (any password works in demo mode): ")
        for a in load("admin_and_ops.json")["admin_users"]:
            print(f"  {a['email']}  ->  {a['role']}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
