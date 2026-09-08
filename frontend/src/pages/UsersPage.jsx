import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Chip from "../components/Chip.jsx";
import { DEMO_USERS } from "../lib/demoData.js";

const STATUS_TONE = { ACTIVE: "green", BLOCKED: "rust", UNDER_REVIEW: "amber" };
const RISK_TONE = { Low: "green", Medium: "amber", High: "rust" };

const COLUMNS = [
  { key: "user_id", label: "User ID", render: (r) => <span className="font-mono text-[13px]">{r.user_id}</span> },
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "state", label: "State" },
  { key: "district", label: "District" },
  { key: "kyc_status", label: "KYC Status" },
  {
    key: "account_status",
    label: "Account Status",
    render: (r) => <Chip tone={STATUS_TONE[r.account_status] || "slate"}>{r.account_status.replace("_", " ")}</Chip>,
  },
  {
    key: "risk_level",
    label: "Risk Level",
    render: (r) => <Chip tone={RISK_TONE[r.risk_level] || "slate"}>{r.risk_level}</Chip>,
  },
  { key: "created_at", label: "Registered On" },
];

/* ---------------------------------------------------------------
   UsersPage — citizen (applicant-facing app) user accounts. No props.
   --------------------------------------------------------------- */
export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="Users"
        breadcrumb={["Users", "Users"]}
        description="End-user accounts for the ArthaSetu citizen-facing application."
      />

      <DataTable
        title="users"
        columns={COLUMNS}
        rows={DEMO_USERS}
        rowKey="user_id"
        pageSize={10}
        searchFields={["user_id", "name", "phone", "state", "district"]}
      />
    </div>
  );
}
