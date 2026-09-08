import { useState } from "react";
import { History } from "lucide-react";
import { SCHEMES, PARTNER_TYPES } from "../lib/demoData.js";
import { can } from "../lib/rbac.js";
import { downloadCsv } from "../lib/csv.js";
import { fmtINR, fmtPct, NA } from "../lib/format.js";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Drawer from "../components/Drawer.jsx";
import Chip from "../components/Chip.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

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

function generateSchemeId(name, existingIds) {
  const initials =
    (name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 4) || "NEW";
  let seq = existingIds.length + 1;
  let id;
  do {
    id = `NSFDC_${initials}_${String(seq).padStart(3, "0")}`;
    seq += 1;
  } while (existingIds.includes(id));
  return id;
}

const EMPTY_SCHEME_FORM = {
  scheme_name: "",
  category: "",
  target_gender: "All",
  max_loan_limit_inr: "",
  interest_rate_male_pct: "",
  interest_rate_female_pct: "",
  max_repayment_period_months: "",
  allowed_channel_partners: PARTNER_TYPES[0] || "",
  status: "draft",
};

/* ---------------------------------------------------------------
   Small definition-list item used throughout the scheme drawer.
   --------------------------------------------------------------- */
function DL({ label, children }) {
  return (
    <div>
      <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--slate)]">{label}</div>
      <div className="mt-1 text-[14px] font-medium text-[var(--ink)]">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------
   SchemeDrawer — read-only detail view for one NSFDC scheme.
   Ported from legacy SchemeDrawer (lines ~1110-1161). The
   gender-differentiated / conditional interest-rate logic is a
   real domain feature and is kept as its own clearly labelled
   section rather than folded into a generic "interest rate" field.
   --------------------------------------------------------------- */
function SchemeDrawer({ scheme, onClose }) {
  return (
    <Drawer title={scheme?.scheme_name} subtitle={scheme ? `${scheme.scheme_id} · ${scheme.category}` : ""} onClose={onClose}>
      {scheme && (
        <div className="space-y-6">
          <div className="rounded border border-[var(--brass-soft)] bg-[var(--brass-soft)]/40 px-4 py-3 text-[13px] leading-relaxed text-[var(--ink)]">
            Do not modify government scheme rules without validation and admin confirmation. All values shown are
            sourced from the NSFDC Scheme Master CSV.
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DL label="Target Gender">{scheme.target_gender}</DL>
            <DL label="Status">{scheme.active ? <Chip tone="green">ACTIVE</Chip> : <Chip tone="slate">INACTIVE</Chip>}</DL>
            <DL label="Max Project Cost">{scheme.max_project_cost_inr != null ? fmtINR(scheme.max_project_cost_inr) : <NA />}</DL>
            <DL label="Max Loan Limit">{fmtINR(scheme.max_loan_limit_inr)}</DL>
            <DL label="Loan % Cap">{fmtPct(scheme.loan_percentage_cap, 0)}</DL>
            <DL label="Max Repayment Period">{scheme.max_repayment_period_months} months</DL>
            <DL label="Moratorium">
              {scheme.moratorium_period_months}
              {typeof scheme.moratorium_period_months === "number" ? " months" : ""}
            </DL>
            <DL label="Allowed Channel Partner Type">{scheme.allowed_channel_partners}</DL>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-[13.5px] font-bold uppercase tracking-wide text-[var(--green-deep)]">
                Interest Rate Rules
              </h3>
              <span className="h-px flex-1 bg-[var(--sage-line)]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] p-4">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--slate)]">
                  Male Applicant
                </div>
                <div className="mt-1 text-[20px] font-bold text-[var(--ink)]">
                  {scheme.interest_rate_male_pct != null ? fmtPct(scheme.interest_rate_male_pct, 1) : <NA />}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] p-4">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--slate)]">
                  Female Applicant
                </div>
                <div className="mt-1 text-[20px] font-bold text-[var(--ink)]">
                  {scheme.interest_rate_female_pct != null ? fmtPct(scheme.interest_rate_female_pct, 1) : <NA />}
                </div>
              </div>
            </div>
            {scheme.interest_rate_conditional_logic && (
              <div className="mt-3 rounded border border-[var(--amber-soft)] bg-[var(--amber-soft)]/50 px-4 py-3 text-[13px] leading-relaxed text-[var(--ink)]">
                <span className="font-semibold text-[var(--amber)]">Conditional logic: </span>
                {scheme.interest_rate_conditional_logic}
              </div>
            )}
          </div>

          <div className="h-px bg-[var(--sage-line)]" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DL label="Source Authority">{scheme.source_authority}</DL>
            <DL label="Last Verified">{scheme.last_verified}</DL>
            <DL label="Last Updated">{scheme.last_updated}</DL>
            <DL label="Eligibility Status">
              <Chip tone="green">VERIFIED FROM SOURCE</Chip>
            </DL>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-[13.5px] font-bold uppercase tracking-wide text-[var(--green-deep)]">
                Change History
              </h3>
              <span className="h-px flex-1 bg-[var(--sage-line)]" />
            </div>
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--sage-line)] px-6 py-8 text-center">
              <History size={22} strokeWidth={1.5} className="text-[var(--sage-line)]" />
              <div className="text-[13.5px] text-[var(--slate)]">No changes recorded since import on 2026-09-04.</div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

/* ---------------------------------------------------------------
   SchemesPage — serves schemes-all / schemes-active / schemes-inactive.
   Ported from legacy SchemesPage (lines ~1163-1210).
   --------------------------------------------------------------- */
export default function SchemesPage({ filterActive, user, setPage }) {
  const [schemeList, setSchemeList] = useState(SCHEMES);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_SCHEME_FORM);
  const [addError, setAddError] = useState("");

  let rows = schemeList;
  if (filterActive === true) rows = rows.filter((s) => s.active);
  if (filterActive === false) rows = rows.filter((s) => !s.active);
  if (typeFilter) rows = rows.filter((s) => s.category === typeFilter);

  const categories = [...new Set(schemeList.map((s) => s.category))];
  const pageTitle = filterActive === true ? "Active Schemes" : filterActive === false ? "Inactive Schemes" : "All Schemes";

  function openAdd() {
    setAddForm(EMPTY_SCHEME_FORM);
    setAddError("");
    setAddOpen(true);
  }

  function submitAdd() {
    if (!addForm.scheme_name.trim()) {
      setAddError("Scheme Name is required.");
      return;
    }
    const now = new Date().toISOString().slice(0, 10);
    const scheme_id = generateSchemeId(
      addForm.scheme_name,
      schemeList.map((s) => s.scheme_id)
    );
    setSchemeList((prev) => [
      {
        scheme_id,
        scheme_name: addForm.scheme_name.trim(),
        category: addForm.category.trim() || "Uncategorized",
        target_gender: addForm.target_gender,
        max_project_cost_inr: null,
        max_loan_limit_inr: Number(addForm.max_loan_limit_inr) || 0,
        loan_percentage_cap: null,
        interest_rate_male_pct: addForm.interest_rate_male_pct === "" ? null : Number(addForm.interest_rate_male_pct),
        interest_rate_female_pct: addForm.interest_rate_female_pct === "" ? null : Number(addForm.interest_rate_female_pct),
        interest_rate_conditional_logic: null,
        max_repayment_period_months: Number(addForm.max_repayment_period_months) || 0,
        moratorium_period_months: null,
        allowed_channel_partners: addForm.allowed_channel_partners,
        status: addForm.status,
        active: addForm.status === "active",
        source_authority: "Manually added by admin",
        last_verified: now,
        last_updated: now,
      },
      ...prev,
    ]);
    setAddOpen(false);
  }

  const columns = [
    { key: "scheme_id", label: "Scheme ID", render: (r) => <span className="font-mono text-[13px]">{r.scheme_id}</span> },
    { key: "scheme_name", label: "Scheme Name" },
    { key: "category", label: "Type / Category" },
    { key: "target_gender", label: "Gender" },
    {
      key: "max_project_cost_inr",
      label: "Max Project Cost",
      render: (r) => (r.max_project_cost_inr != null ? fmtINR(r.max_project_cost_inr) : <NA />),
    },
    { key: "max_loan_limit_inr", label: "Max Loan Limit", render: (r) => fmtINR(r.max_loan_limit_inr) },
    { key: "loan_percentage_cap", label: "Loan % Cap", render: (r) => fmtPct(r.loan_percentage_cap, 0) },
    {
      key: "interest_rate_male_pct",
      label: "Interest (M / F)",
      render: (r) => (
        <span>
          {r.interest_rate_male_pct != null ? fmtPct(r.interest_rate_male_pct, 1) : "NA"} /{" "}
          {r.interest_rate_female_pct != null ? fmtPct(r.interest_rate_female_pct, 1) : "NA"}
        </span>
      ),
    },
    { key: "max_repayment_period_months", label: "Max Repayment", render: (r) => r.max_repayment_period_months + " mo" },
    { key: "allowed_channel_partners", label: "Allowed Partner Type" },
    {
      key: "active",
      label: "Status",
      render: (r) =>
        r.status === "draft" ? (
          <Chip tone="brass">DRAFT</Chip>
        ) : r.active ? (
          <Chip tone="green">ACTIVE</Chip>
        ) : (
          <Chip tone="slate">INACTIVE</Chip>
        ),
    },
    { key: "last_updated", label: "Last Updated" },
  ];

  return (
    <div>
      <PageHeader
        title={pageTitle}
        breadcrumb={["Schemes", pageTitle]}
        description={`Source of truth: NSFDC Scheme Master CSV — ${schemeList.length} schemes on file.`}
        actions={
          <>
            <select
              className="rounded border border-[var(--sage-line)] bg-white px-3 py-2 text-[13px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:outline-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {can(user, "edit_schemes") && (
              <button
                className="rounded border border-[var(--sage-line)] bg-white px-3.5 py-2 text-[13px] font-semibold text-[var(--ink)] hover:bg-[#F2F2EF]"
                onClick={() =>
                  downloadCsv(
                    "schemes.csv",
                    rows,
                    columns.map((c) => ({ key: c.key, label: c.label }))
                  )
                }
              >
                Export
              </button>
            )}
            {can(user, "edit_schemes") && (
              <button
                className="rounded border border-[var(--sage-line)] bg-white px-3.5 py-2 text-[13px] font-semibold text-[var(--ink)] hover:bg-[#F2F2EF]"
                onClick={() => (setPage ? setPage("schemes-import") : undefined)}
                disabled={!setPage}
                title={setPage ? undefined : "Navigation unavailable"}
              >
                Import
              </button>
            )}
            {can(user, "edit_schemes") && (
              <button
                className="rounded bg-[var(--green-mid)] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[var(--green-deep)]"
                onClick={openAdd}
              >
                + Add Scheme
              </button>
            )}
          </>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="scheme_id"
        onRowClick={setSelected}
        title="schemes"
        searchFields={["scheme_id", "scheme_name", "category"]}
      />
      <SchemeDrawer scheme={selected} onClose={() => setSelected(null)} />

      {addOpen && (
        <ConfirmModal
          title="Add Scheme"
          confirmLabel="Add Scheme"
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
              label="Scheme Name"
              placeholder="e.g. New Business Scheme"
              value={addForm.scheme_name}
              onChange={(e) => setAddForm((f) => ({ ...f, scheme_name: e.target.value }))}
            />
            <Field
              label="Category"
              placeholder="e.g. Mid-Tier (Urban/Retail)"
              value={addForm.category}
              onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
            />
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--sage)]">Target Gender</label>
              <select
                className="w-full rounded border border-[var(--sage-line)] bg-white px-3 py-2 text-[13.5px] text-[var(--ink)]"
                value={addForm.target_gender}
                onChange={(e) => setAddForm((f) => ({ ...f, target_gender: e.target.value }))}
              >
                <option>All</option>
                <option>Female</option>
                <option>Male</option>
              </select>
            </div>
            <Field
              label="Max Loan Limit (INR)"
              type="number"
              placeholder="e.g. 450000"
              value={addForm.max_loan_limit_inr}
              onChange={(e) => setAddForm((f) => ({ ...f, max_loan_limit_inr: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Interest Rate — Male %"
                type="number"
                step="0.1"
                value={addForm.interest_rate_male_pct}
                onChange={(e) => setAddForm((f) => ({ ...f, interest_rate_male_pct: e.target.value }))}
              />
              <Field
                label="Interest Rate — Female %"
                type="number"
                step="0.1"
                value={addForm.interest_rate_female_pct}
                onChange={(e) => setAddForm((f) => ({ ...f, interest_rate_female_pct: e.target.value }))}
              />
            </div>
            <Field
              label="Max Repayment Period (months)"
              type="number"
              value={addForm.max_repayment_period_months}
              onChange={(e) => setAddForm((f) => ({ ...f, max_repayment_period_months: e.target.value }))}
            />
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--sage)]">
                Allowed Channel Partner Type
              </label>
              <select
                className="w-full rounded border border-[var(--sage-line)] bg-white px-3 py-2 text-[13.5px] text-[var(--ink)]"
                value={addForm.allowed_channel_partners}
                onChange={(e) => setAddForm((f) => ({ ...f, allowed_channel_partners: e.target.value }))}
              >
                {PARTNER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--sage)]">Status</label>
              <select
                className="w-full rounded border border-[var(--sage-line)] bg-white px-3 py-2 text-[13.5px] text-[var(--ink)]"
                value={addForm.status}
                onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div className="rounded border border-[var(--sage-line)] bg-[var(--green-soft)] px-3 py-2.5 text-[12.5px] text-[var(--ink)]">
              A Scheme ID is generated automatically. This adds the scheme to this session's working list
              immediately. It is not yet persisted to a backend — no database exists in this build.
            </div>
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}
