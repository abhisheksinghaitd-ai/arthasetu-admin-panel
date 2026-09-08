import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Drawer from "../components/Drawer.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { PARTNER_TYPES, STATES } from "../lib/demoData.js";
import { can } from "../lib/rbac.js";
import { downloadCsv } from "../lib/csv.js";
import {
  fmtLakh,
  fmtPct,
  fmtNum,
  NA,
  effectiveStatus,
  statusChip,
  locationChip,
  dqChip,
} from "../lib/format.js";

const SELECT_CLS =
  "rounded border border-[var(--sage-line)] bg-white px-3 py-2 text-[13.5px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:outline-none";
const BTN_SECONDARY =
  "rounded border border-[var(--sage-line)] bg-white px-4 py-2 text-[13px] font-semibold text-[var(--ink)] hover:bg-[#F2F2EF]";
const BTN_PRIMARY =
  "rounded bg-[var(--green-mid)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--green-deep)]";

/* Renders a value, or the "Not Available" style when null/undefined. */
function orNA(v) {
  return v === null || v === undefined || v === "" ? <NA /> : v;
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 border-b border-[var(--sage-line)] pb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--sage)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DL({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--slate)]">{k}</dt>
          <dd className="mt-0.5 text-[14px] text-[var(--ink)]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function WarnBox({ children }) {
  return (
    <div className="mb-6 rounded-md border border-[#E9D3A0] bg-[var(--amber-soft)] px-4 py-3 text-[13px] leading-relaxed text-[var(--ink)]">
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------
   PartnerDrawer — full channel-partner detail slide-over.
   Ported from legacy PartnerDrawer (lines ~1273-1342).
   --------------------------------------------------------------- */
function PartnerDrawer({ partner, onClose }) {
  const status = partner ? effectiveStatus(partner) : null;

  return (
    <Drawer
      title={partner?.partner_name}
      subtitle={partner ? `${partner.partner_id} · ${partner.partner_type} · ${partner.state}` : null}
      onClose={onClose}
    >
      {!partner ? null : (
      <>
      {status === "UNDER REVIEW" && (
        <WarnBox>
          Source active_status for this partner is <b>UNKNOWN</b>. Admin has not yet confirmed operational
          status — excluded from routing until reviewed.
        </WarnBox>
      )}

      <Section title="Overview">
        <DL
          items={[
            ["Partner Type", partner.partner_type],
            ["Status", statusChip(status)],
            ["State", partner.state],
            ["As-of Date", orNA(partner.as_of_date)],
            ["Data Quality", dqChip(partner.data_quality_flag)],
            ["Scheme Match Type", `${partner.type_based_scheme_count} scheme(s) — type-level`],
          ]}
        />
      </Section>

      <Section title="Financial Performance">
        <DL
          items={[
            ["Sanction Amount", orNA(fmtLakh(partner.amount_sanction_lakh))],
            ["Net Disbursement", orNA(fmtLakh(partner.net_disbursement_lakh))],
            ["Funds Utilisation", orNA(fmtLakh(partner.funds_utilisation_lakh))],
            ["Utilization %", orNA(fmtPct(partner.utilization_pct, 1))],
            ["Pending Utilisation", orNA(fmtLakh(partner.pending_utilisation_lakh))],
            ["Pending %", orNA(fmtPct(partner.pending_as_pct_of_net_disbursement, 1))],
            ["Disbursement Realization %", orNA(fmtPct(partner.disbursement_realization_pct, 1))],
            ["Recent Utilisation", orNA(fmtLakh(partner.recent_utilisation_amount_lakh))],
          ]}
        />
      </Section>

      <Section title="Beneficiaries">
        <DL
          items={[
            ["Recent Beneficiaries", orNA(fmtNum(partner.recent_beneficiaries, 0))],
            ["Cumulative Beneficiaries", orNA(fmtNum(partner.cumulative_beneficiaries, 0))],
            ["Avg Disbursement / Beneficiary", orNA(fmtLakh(partner.avg_cumulative_disbursement_per_beneficiary_lakh))],
            [
              "Avg Recent Util / Recent Beneficiary",
              partner.avg_recent_utilisation_per_recent_beneficiary_lakh != null
                ? fmtLakh(partner.avg_recent_utilisation_per_recent_beneficiary_lakh)
                : <NA />,
            ],
          ]}
        />
      </Section>

      <Section title="Location">
        <DL
          items={[
            ["Latitude", orNA(partner.partner_location_latitude)],
            ["Longitude", orNA(partner.partner_location_longitude)],
            ["Location Status", locationChip(partner)],
          ]}
        />
        {!partner.has_location && (
          <WarnBox>
            Location Not Available. This partner cannot receive a valid nearest-location distance result
            until coordinates are verified.
          </WarnBox>
        )}
      </Section>

      <Section title="Overdue / NPA">
        <WarnBox>Overdue / NPA Data: Not Available — no official source provided for this dataset.</WarnBox>
      </Section>

      <Section title="Scheme Compatibility">
        <WarnBox>{partner.scheme_mapping_note}</WarnBox>
      </Section>

      <Section title="Data Source">
        <DL
          items={[
            ["Source", "Partner_Router_Master (uploaded XLSX)"],
            ["Source Row", `#${partner.source_slno}`],
          ]}
        />
      </Section>
      </>
      )}
    </Drawer>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-[var(--sage)]">{label}</label>
      <input
        className="w-full rounded border border-[var(--sage-line)] bg-[#FCFCFA] px-3 py-2 text-[13.5px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:bg-white focus:outline-none"
        {...props}
      />
    </div>
  );
}

const EMPTY_PARTNER_FORM = { partner_name: "", partner_type: PARTNER_TYPES[0] || "", state: STATES[0] || "" };

/* ---------------------------------------------------------------
   PartnersPage — channel-partner directory, props {partners, setPartners, user}.
   Adding a partner mutates the lifted `partners` state via setPartners
   (the same state PartnerStatusPage mutates) so a newly-added partner
   is immediately visible everywhere else that reads it too.
   --------------------------------------------------------------- */
export default function PartnersPage({ partners, setPartners, user }) {
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_PARTNER_FORM);
  const [addError, setAddError] = useState("");

  function openAdd() {
    setAddForm(EMPTY_PARTNER_FORM);
    setAddError("");
    setAddOpen(true);
  }

  function submitAdd() {
    if (!addForm.partner_name.trim()) {
      setAddError("Partner Name is required.");
      return;
    }
    const nextId = partners.reduce((max, p) => Math.max(max, p.partner_id), 0) + 1;
    const now = new Date().toISOString().slice(0, 10);
    setPartners((prev) => [
      {
        partner_id: nextId,
        partner_name: addForm.partner_name.trim(),
        partner_type: addForm.partner_type,
        state: addForm.state,
        amount_sanction_lakh: null,
        net_disbursement_lakh: null,
        utilization_pct: null,
        pending_as_pct_of_net_disbursement: null,
        cumulative_beneficiaries: null,
        has_location: false,
        active_status: "UNKNOWN",
        admin_status_override: null,
        data_quality_flag: null,
        as_of_date: now,
        source_slno: null,
      },
      ...prev,
    ]);
    setAddOpen(false);
  }

  let rows = partners;
  if (typeFilter) rows = rows.filter((p) => p.partner_type === typeFilter);
  if (stateFilter) rows = rows.filter((p) => p.state === stateFilter);
  if (statusFilter) rows = rows.filter((p) => effectiveStatus(p) === statusFilter);

  const columns = [
    { key: "partner_id", label: "ID", render: (r) => <span className="font-mono text-[13px]">{r.partner_id}</span> },
    { key: "partner_name", label: "Channel Partner Name" },
    { key: "partner_type", label: "Type" },
    { key: "state", label: "State" },
    { key: "amount_sanction_lakh", label: "Sanction", render: (r) => orNA(fmtLakh(r.amount_sanction_lakh)) },
    { key: "net_disbursement_lakh", label: "Net Disbursement", render: (r) => orNA(fmtLakh(r.net_disbursement_lakh)) },
    { key: "utilization_pct", label: "Util %", render: (r) => orNA(fmtPct(r.utilization_pct, 1)) },
    {
      key: "pending_as_pct_of_net_disbursement",
      label: "Pending %",
      render: (r) => orNA(fmtPct(r.pending_as_pct_of_net_disbursement, 1)),
    },
    {
      key: "cumulative_beneficiaries",
      label: "Cum. Beneficiaries",
      render: (r) => orNA(fmtNum(r.cumulative_beneficiaries, 0)),
    },
    { key: "has_location", label: "Location", render: (r) => locationChip(r) },
    { key: "_status", label: "Status", render: (r) => statusChip(effectiveStatus(r)) },
    { key: "data_quality_flag", label: "Data Quality", render: (r) => dqChip(r.data_quality_flag) },
  ];

  return (
    <div>
      <PageHeader
        title="All Partners"
        breadcrumb={["Partners", "All Partners"]}
        description={`${partners.length} channel partners on file — source: Partner_Router_Master (as of 31 Jul 2026).`}
        actions={
          can(user, "edit_partners") && (
            <>
              <button
                className={BTN_SECONDARY}
                onClick={() =>
                  downloadCsv(
                    "channel-partners.csv",
                    rows,
                    columns.map((c) => ({ key: c.key, label: c.label }))
                  )
                }
              >
                Export
              </button>
              <button className={BTN_PRIMARY} onClick={openAdd}>
                + Add Partner
              </button>
            </>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <select className={SELECT_CLS} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {PARTNER_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className={SELECT_CLS} value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="">All States</option>
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className={SELECT_CLS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
          <option>BLOCKED</option>
          <option>UNDER REVIEW</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey="partner_id"
        onRowClick={setSelected}
        title="partners"
        searchFields={["partner_id", "partner_name", "state", "partner_type"]}
        pageSize={12}
      />

      <PartnerDrawer partner={selected} onClose={() => setSelected(null)} />

      {addOpen && (
        <ConfirmModal
          title="Add Partner"
          confirmLabel="Add Partner"
          onClose={() => setAddOpen(false)}
          onConfirm={submitAdd}
        >
          <div className="space-y-4">
            {addError && (
              <div className="rounded border border-[#E3B7AC] bg-[var(--rust-soft)] px-3 py-2 text-[12.5px] text-[var(--rust)]">
                {addError}
              </div>
            )}
            <Field
              label="Channel Partner Name"
              placeholder="e.g. State Cooperative Bank Ltd."
              value={addForm.partner_name}
              onChange={(e) => setAddForm((f) => ({ ...f, partner_name: e.target.value }))}
            />
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--sage)]">Type</label>
              <select
                className="w-full rounded border border-[var(--sage-line)] bg-white px-3 py-2 text-[13.5px] text-[var(--ink)]"
                value={addForm.partner_type}
                onChange={(e) => setAddForm((f) => ({ ...f, partner_type: e.target.value }))}
              >
                {PARTNER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--sage)]">State</label>
              <select
                className="w-full rounded border border-[var(--sage-line)] bg-white px-3 py-2 text-[13.5px] text-[var(--ink)]"
                value={addForm.state}
                onChange={(e) => setAddForm((f) => ({ ...f, state: e.target.value }))}
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded border border-[var(--sage-line)] bg-[var(--green-soft)] px-3 py-2.5 text-[12.5px] text-[var(--ink)]">
              Financial performance, location and status fields have no source data yet for a newly-added
              partner and will show as Not Available / Under Review until confirmed by an admin on the
              Partner Status page — this adds the record to this session's working list immediately; it is
              not yet persisted to a backend.
            </div>
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}
