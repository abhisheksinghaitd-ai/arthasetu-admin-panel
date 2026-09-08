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
  return (
    <div>
      <PageHeader
        title="Applications"
        breadcrumb={["Users", "Applications"]}
        description="Loan / scheme applications submitted through the ArthaSetu citizen application."
      />

      <DataTable
        title="applications"
        columns={COLUMNS}
        rows={DEMO_APPLICATIONS}
        rowKey="application_id"
        pageSize={10}
        searchFields={["application_id", "user_name", "scheme_id", "partner_name", "status"]}
      />
    </div>
  );
}
