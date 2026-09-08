import { useState } from "react";
import { ArrowRight } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import Chip from "../components/Chip.jsx";
import DataTable from "../components/DataTable.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { NA } from "../lib/format.js";
import { can } from "../lib/rbac.js";
import { API_REGISTRY } from "../lib/demoData.js";

const MAPPING_ROWS = [
  { from: "partner_name", to: "partner_name", required: "Yes", type: "string" },
  { from: "state", to: "state", required: "Yes", type: "string" },
  { from: "utilization_pct", to: "utilization_pct", required: "Yes", type: "float" },
  { from: "funds_utilisation", to: "funds_utilisation_lakh", required: "Yes", type: "float" },
  { from: "overdue_ratio", to: "overdue_ratio", required: "No", type: "float" },
  { from: "latitude", to: "partner_location_latitude", required: "No", type: "float" },
  { from: "longitude", to: "partner_location_longitude", required: "No", type: "float" },
];

const API_COLUMNS = [
  { key: "name", label: "API Name" },
  { key: "provider", label: "Provider" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status", render: (a) => <Chip tone="slate">{a.status}</Chip> },
  { key: "auth", label: "Auth Type" },
  { key: "lastSync", label: "Last Sync" },
  { key: "freq", label: "Frequency" },
  { key: "errors", label: "Errors" },
];

/* ---------------------------------------------------------------
   ApiManagementPage — external data feed configuration/monitoring.
   Ported from legacy ApiManagementPage({user}) / API_REGISTRY.
   Stat tiles consolidated: several legacy tiles (Healthy APIs,
   APIs with Errors, Failed Syncs, Records Updated) were all zero
   for identical reasons ("no live API is configured") — folded
   into one explanatory note instead of five near-empty tiles.
   --------------------------------------------------------------- */
const EMPTY_API_FORM = {
  name: "",
  provider: "",
  baseUrl: "",
  category: "Government Scheme Data",
  auth: "No Auth",
};

export default function ApiManagementPage({ user }) {
  const [apiList, setApiList] = useState(API_REGISTRY);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_API_FORM);
  const [addError, setAddError] = useState("");
  const [testOpen, setTestOpen] = useState(null);
  const [testResult, setTestResult] = useState(null);

  function openAdd() {
    setAddForm(EMPTY_API_FORM);
    setAddError("");
    setAddOpen(true);
  }

  function submitAdd() {
    if (!addForm.name.trim() || !addForm.baseUrl.trim()) {
      setAddError("API Name and Base URL are required.");
      return;
    }
    setApiList((prev) => [
      {
        name: addForm.name.trim(),
        provider: addForm.provider.trim() || "Unspecified",
        category: addForm.category,
        endpoint: addForm.baseUrl.trim(),
        type: addForm.category,
        status: "Not Configured",
        auth: addForm.auth,
        lastSync: null,
        freq: "—",
        records: 0,
        errors: 0,
      },
      ...prev,
    ]);
    setAddOpen(false);
  }

  function runTest(api) {
    setTestOpen(api);
    setTestResult(null);
    setTimeout(
      () =>
        setTestResult({
          status: "FAILED",
          code: "—",
          time: "—",
          msg: "No endpoint configured — add a Base URL and Endpoint before testing.",
        }),
      700
    );
  }

  const columnsWithActions = [
    ...API_COLUMNS,
    { key: "actions", label: "Actions", sortable: false, render: (a) => (
      <button
        className="rounded border border-[var(--sage-line)] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[var(--ink)] hover:bg-[#F2F2EF]"
        onClick={() => runTest(a)}
      >
        Test API
      </button>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="API Management"
        breadcrumb={["Data Management", "API Management"]}
        description="Connect and monitor external data feeds. No live APIs are currently configured — all data in this console was loaded via manual CSV/XLSX upload."
        actions={
          can(user, "manage_api") && (
            <button
              className="rounded bg-[var(--green-mid)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--green-deep)]"
              onClick={openAdd}
            >
              + Add API
            </button>
          )
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total APIs Registered" value={apiList.length} />
        <StatCard label="Active APIs" value={0} tone="bad" />
        <StatCard label="Inactive / Not Configured" value={apiList.length} tone="warn" />
        <StatCard label="Last Successful Sync" value={<NA />} />
      </div>

      <DataTable
        title="registered APIs"
        columns={columnsWithActions}
        rows={apiList}
        rowKey="name"
        pageSize={10}
        searchFields={["name", "provider", "category", "status"]}
      />

      <div className="mb-3 mt-10 flex items-center gap-3">
        <h2 className="text-[15px] font-bold text-[var(--ink)]">Data Mapping (Example — not yet active)</h2>
        <div className="h-px flex-1 bg-[var(--sage-line)]" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <table className="w-full min-w-max border-collapse text-[13.5px]">
          <thead>
            <tr>
              {["API Response Field", "", "ArthaSetu DB Field", "Required", "Type"].map((h, i) => (
                <th
                  key={i}
                  className="whitespace-nowrap border-b border-[var(--sage-line)] bg-[#FAFAF7] px-4 py-3 text-left text-[12px] font-semibold tracking-wide text-[var(--slate)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MAPPING_ROWS.map((m, i) => (
              <tr key={i} className="border-b border-[#EFF1EE]">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-[var(--ink)]">{m.from}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--slate)]">
                  <ArrowRight size={13} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-[var(--ink)]">{m.to}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--ink)]">{m.required}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--ink)]">{m.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <ConfirmModal title="Add API" confirmLabel="Add API" onClose={() => setAddOpen(false)} onConfirm={submitAdd}>
          <div className="space-y-4">
            {addError && (
              <div className="rounded border border-[#E3B7AC] bg-[var(--rust-soft)] px-3 py-2 text-[12.5px] text-[var(--rust)]">
                {addError}
              </div>
            )}
            <Field
              label="API Name"
              placeholder="e.g. Partner Utilization Feed"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Field
              label="Provider"
              placeholder="e.g. NSFDC"
              value={addForm.provider}
              onChange={(e) => setAddForm((f) => ({ ...f, provider: e.target.value }))}
            />
            <Field
              label="Base URL"
              placeholder="https://"
              value={addForm.baseUrl}
              onChange={(e) => setAddForm((f) => ({ ...f, baseUrl: e.target.value }))}
            />
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--sage)]">Data Category</label>
              <select
                className="w-full rounded border border-[var(--sage-line)] bg-[#FCFCFA] px-3 py-2 text-[13.5px] text-[var(--ink)]"
                value={addForm.category}
                onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option>Government Scheme Data</option>
                <option>Partner Data</option>
                <option>Fund Utilization Data</option>
                <option>Overdue / NPA Data</option>
                <option>Partner Location Data</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--sage)]">Authentication Type</label>
              <select
                className="w-full rounded border border-[var(--sage-line)] bg-[#FCFCFA] px-3 py-2 text-[13.5px] text-[var(--ink)]"
                value={addForm.auth}
                onChange={(e) => setAddForm((f) => ({ ...f, auth: e.target.value }))}
              >
                <option>No Auth</option>
                <option>API Key</option>
                <option>Bearer Token</option>
                <option>OAuth2</option>
                <option>Basic Auth</option>
              </select>
            </div>
            <Field label="API Key / Token" type="password" placeholder="Stored securely server-side — never shown in UI" />
            <div className="rounded border border-[var(--sage-line)] bg-[var(--green-soft)] px-3 py-2.5 text-[12.5px] text-[var(--ink)]">
              This registers the API in this session's working list with status "Not Configured" — credentials
              are never transmitted or persisted by this form, and no live connection is made until it is
              tested and a real backend integration exists.
            </div>
          </div>
        </ConfirmModal>
      )}

      {testOpen && (
        <ConfirmModal
          title={"Test API — " + testOpen.name}
          confirmLabel="Close"
          onClose={() => setTestOpen(null)}
          onConfirm={() => setTestOpen(null)}
        >
          {!testResult ? (
            <div className="text-[13.5px] text-[var(--slate)]">Testing connection…</div>
          ) : (
            <div>
              <div className="mb-3 rounded border border-[#E3B7AC] bg-[var(--rust-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--rust)]">
                Result: {testResult.status}
              </div>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11.5px] font-semibold tracking-wide text-[var(--slate)]">HTTP STATUS</div>
                  <div className="text-[13.5px] text-[var(--ink)]">{testResult.code}</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-semibold tracking-wide text-[var(--slate)]">RESPONSE TIME</div>
                  <div className="text-[13.5px] text-[var(--ink)]">{testResult.time}</div>
                </div>
              </div>
              <p className="text-[13px] text-[var(--slate)]">{testResult.msg}</p>
            </div>
          )}
        </ConfirmModal>
      )}
    </div>
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
