import { useEffect, useState } from "react";
import { api } from "../api.js";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Chip from "../components/Chip.jsx";
import { NA } from "../lib/format.js";
import { DEMO_APPLICATIONS } from "../lib/demoData.js";

const STATUS_TONE = {
  matched: "slate",
  applied: "brass",
  under_review: "amber",
  sanctioned: "green",
  disbursed: "green",
};

const COLUMNS = [
  { key: "application_id", label: "Application ID", render: (r) => <span className="font-mono text-[13px]">{r.application_id}</span> },
  { key: "user_name", label: "Applicant" },
  { key: "scheme_id", label: "Scheme", render: (r) => <span className="font-mono text-[12.5px]">{r.scheme_id}</span> },
  { key: "partner_name", label: "Routed Partner" },
  {
    key: "status",
    label: "Status",
    render: (r) => <Chip tone={STATUS_TONE[r.status] || "slate"}>{r.status.replace("_", " ").toUpperCase()}</Chip>,
  },
  {
    key: "loan_amount_sanctioned",
    label: "Sanctioned Amount",
    render: (r) => (r.loan_amount_sanctioned != null ? `₹${r.loan_amount_sanctioned.toLocaleString("en-IN")}` : <NA />),
  },
  { key: "applied_at", label: "Applied On" },
];

/* ---------------------------------------------------------------
   ApplicationsPage — loan/scheme applications submitted through
   the ArthaSetu citizen app. No props.
   --------------------------------------------------------------- */
export default function ApplicationsPage() {
  const [rows, setRows] = useState(DEMO_APPLICATIONS);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const appsData = await api.listApplications({ page_size: 200 });

        // Applicant/partner names are looked up best-effort — a role that
        // can't read users or partners (e.g. Support Staff) still sees
        // applications, just with raw refs instead of resolved names.
        let userNameByRef = {};
        let partnerNameByRef = {};
        try {
          const usersData = await api.listUsers({ page_size: 200 });
          userNameByRef = Object.fromEntries(usersData.results.map((u) => [u.user_ref, u.name]));
        } catch (_) {}
        try {
          const partnersData = await api.listPartners({ page_size: 200 });
          partnerNameByRef = Object.fromEntries(partnersData.results.map((p) => [p.partner_ref, p.name]));
        } catch (_) {}

        const mapped = appsData.results.map((a) => ({
          application_id: a.application_ref,
          user_id: a.user_ref,
          user_name: userNameByRef[a.user_ref] || a.user_ref,
          scheme_id: a.scheme_id,
          partner_name: partnerNameByRef[a.partner_ref] || `Partner #${a.partner_ref}`,
          status: a.status,
          loan_amount_sanctioned: a.loan_amount_sanctioned,
          applied_at: a.applied_at ? String(a.applied_at).slice(0, 10) : "",
        }));

        if (!cancelled) {
          setRows(mapped);
          setOffline(false);
        }
      } catch (err) {
        if (!cancelled) {
          setOffline(true);
          setRows(DEMO_APPLICATIONS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Applications"
        breadcrumb={["Users", "Applications"]}
        description="Loan / scheme applications submitted through the ArthaSetu citizen application."
      />
      {offline && (
        <div className="mb-4 rounded border border-[var(--sage-line)] bg-[var(--amber-soft)] px-4 py-3 text-[13.5px] text-[var(--amber)]">
          Backend not reachable — showing local demo applications.
        </div>
      )}

      <DataTable
        title="applications"
        columns={COLUMNS}
        rows={rows}
        rowKey="application_id"
        pageSize={10}
        searchFields={["application_id", "user_name", "scheme_id", "partner_name", "status"]}
      />
    </div>
  );
}
