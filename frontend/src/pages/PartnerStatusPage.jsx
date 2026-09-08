import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { can } from "../lib/rbac.js";
import { effectiveStatus, statusChip } from "../lib/format.js";

const BTN =
  "rounded border border-[var(--sage-line)] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[var(--ink)] hover:bg-[#F2F2EF]";
const BTN_DANGER =
  "rounded border border-[var(--rust)] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[var(--rust)] hover:bg-[var(--rust-soft)]";
const FIELD_LABEL = "mb-1.5 block text-[12px] font-semibold text-[var(--sage)]";
const FIELD_INPUT =
  "w-full rounded border border-[var(--sage-line)] bg-[#FCFCFA] px-3 py-2 text-[13.5px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:bg-white focus:outline-none disabled:text-[var(--slate)]";

const ACTION_COPY = {
  ACTIVE: "Activate",
  INACTIVE: "Deactivate",
  BLOCKED: "Block",
  "UNDER REVIEW": "Send for Review",
};

/* ---------------------------------------------------------------
   PartnerStatusPage — suspend / blacklist / reinstate workflow.
   Props {partners, setPartners, user} — mutations go through setPartners,
   the state lifted and owned by App.jsx. Ported from legacy
   PartnerStatusPage (lines ~1401-1473); status changes here are
   deliberately gated behind a mandatory audit-trail reason, per the
   government-portal design brief — this is blocking a real financial
   institution from routing.
   --------------------------------------------------------------- */
export default function PartnerStatusPage({ partners, setPartners, user, setAuditLog }) {
  const [target, setTarget] = useState(null);
  const [action, setAction] = useState(null);
  const [effDate, setEffDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reviewDate, setReviewDate] = useState("");

  function openAction(p, act) {
    setTarget(p);
    setAction(act);
    setEffDate(new Date().toISOString().slice(0, 10));
    setReviewDate("");
  }

  function closeModal() {
    setTarget(null);
    setAction(null);
  }

  function apply(reason) {
    setPartners((prev) =>
      prev.map((p) =>
        p.partner_id === target.partner_id
          ? {
              ...p,
              admin_status_override: action,
              status_meta: { reason, effDate, reviewDate, by: user.name, at: new Date().toISOString() },
            }
          : p
      )
    );
    if (setAuditLog) {
      setAuditLog((prev) => [
        {
          time: new Date().toISOString().slice(0, 16).replace("T", " "),
          category: "Partner Status",
          event: `${ACTION_COPY[action] || action} — ${target.partner_name} (Partner ID ${target.partner_id}). Reason: ${reason}`,
          by: user.name,
        },
        ...prev,
      ]);
    }
    closeModal();
  }

  const columns = [
    { key: "partner_id", label: "ID" },
    { key: "partner_name", label: "Partner" },
    { key: "partner_type", label: "Type" },
    { key: "state", label: "State" },
    { key: "_status", label: "Current Status", render: (r) => statusChip(effectiveStatus(r)) },
    {
      key: "_actions",
      label: "Actions",
      sortable: false,
      render: (r) => {
        if (!can(user, "edit_partners")) {
          return <span className="text-[12.5px] text-[var(--slate)]">View only</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            <button className={BTN} onClick={() => openAction(r, "ACTIVE")}>
              Activate
            </button>
            <button className={BTN} onClick={() => openAction(r, "INACTIVE")}>
              Deactivate
            </button>
            <button className={BTN_DANGER} onClick={() => openAction(r, "BLOCKED")}>
              Block
            </button>
            <button className={BTN} onClick={() => openAction(r, "UNDER REVIEW")}>
              Review
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Partner Status Management"
        breadcrumb={["Partners", "Partner Status"]}
        description="Set operational status for each channel partner. Blocked and inactive partners are automatically excluded from Partner Router recommendations."
      />

      <div className="mb-5 rounded-md border border-[#E9D3A0] bg-[var(--amber-soft)] px-4 py-3 text-[13px] leading-relaxed text-[var(--ink)]">
        Source data carries active_status = UNKNOWN for all {partners.length} partners. Until an admin confirms
        a status, partners display as "Under Review" and are excluded from routing.
      </div>

      <DataTable
        columns={columns}
        rows={partners}
        rowKey="partner_id"
        title="partners"
        searchFields={["partner_id", "partner_name", "state"]}
        pageSize={12}
      />

      {target && (
        <ConfirmModal
          title={`${ACTION_COPY[action] || action} — ${target.partner_name}`}
          body="This is an administrative status change and will be recorded in the audit log with your name, reason and effective date."
          confirmLabel={`Confirm ${ACTION_COPY[action] || action}`}
          danger={action === "BLOCKED"}
          requireReason
          reasonLabel={action === "BLOCKED" ? "Reason for blocking (required)" : "Reason for this status change"}
          onClose={closeModal}
          onConfirm={apply}
        >
          <div className="mb-3">
            <label className={FIELD_LABEL}>Effective Date</label>
            <input
              type="date"
              className={FIELD_INPUT}
              value={effDate}
              onChange={(e) => setEffDate(e.target.value)}
            />
          </div>
          {action === "UNDER REVIEW" && (
            <div className="mb-3">
              <label className={FIELD_LABEL}>Review Date</label>
              <input
                type="date"
                className={FIELD_INPUT}
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
              />
            </div>
          )}
          <div className="mb-3">
            <label className={FIELD_LABEL}>Updated By</label>
            <input className={FIELD_INPUT} value={user.name} disabled />
          </div>
          <div className="rounded-md border border-[#E9D3A0] bg-[var(--amber-soft)] px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--ink)]">
            This changes only the partner's status/data. It does not alter any ML ranking score — the router
            will re-rank using the updated status on its next run.
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}
