import { useEffect, useState } from "react";
import { api } from "../api.js";
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

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function mapUser(u) {
  return {
    user_id: u.user_ref,
    name: u.name,
    phone: u.phone,
    state: u.state || "—",
    district: u.district || "—",
    kyc_status: capitalize(u.kyc_status) || "Pending",
    account_status: (u.account_status || "active").toUpperCase(),
    risk_level: capitalize(u.risk_level) || "Low",
    created_at: u.created_at ? String(u.created_at).slice(0, 10) : "",
  };
}

/* ---------------------------------------------------------------
   UsersPage — citizen (applicant-facing app) user accounts. No props.
   --------------------------------------------------------------- */
export default function UsersPage() {
  const [rows, setRows] = useState(DEMO_USERS);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await api.listUsers({ page_size: 200 });
        if (!cancelled) {
          setRows(data.results.map(mapUser));
          setOffline(false);
        }
      } catch (err) {
        if (!cancelled) {
          setOffline(true);
          setRows(DEMO_USERS);
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
        title="Users"
        breadcrumb={["Users", "Users"]}
        description="End-user accounts for the ArthaSetu citizen-facing application."
      />
      {offline && (
        <div className="mb-4 rounded border border-[var(--sage-line)] bg-[var(--amber-soft)] px-4 py-3 text-[13.5px] text-[var(--amber)]">
          Backend not reachable — showing local demo users.
        </div>
      )}

      <DataTable
        title="users"
        columns={COLUMNS}
        rows={rows}
        rowKey="user_id"
        pageSize={10}
        searchFields={["user_id", "name", "phone", "state", "district"]}
      />
    </div>
  );
}
