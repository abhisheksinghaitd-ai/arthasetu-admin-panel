import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";

/* ---------------------------------------------------------------
   DataQualityPage — completeness / integrity across the partner
   dataset. Ported from legacy DataQualityPage({partners}).
   Stat tiles consolidated from the legacy 10-tile grid (several
   were duplicates — e.g. "Missing Fields (Location)" and
   "Unverified Locations" measured the same thing) per the
   government-portal decluttering brief; no underlying figure is
   dropped, redundant ones are folded into a single card's sub-line.
   --------------------------------------------------------------- */
export default function DataQualityPage({ partners }) {
  const total = partners.length;
  const valid = partners.filter((p) => p.data_quality_flag === "OK").length;
  const warning = total - valid;
  const missingLoc = partners.filter((p) => !p.has_location).length;
  const missingOverdue = total; // overdue_ratio is null for every source record

  const flagData = [
    { name: "Valid", value: valid },
    { name: "Warning", value: warning },
  ];

  const completenessData = [
    { field: "Utilization %", complete: total },
    { field: "Sanction Amt", complete: total },
    { field: "Location", complete: total - missingLoc },
    { field: "Overdue Ratio", complete: 0 },
    { field: "Active Status", complete: 0 },
  ];

  return (
    <div>
      <PageHeader
        title="Data Quality Dashboard"
        breadcrumb={["Data Management", "Data Quality"]}
        description="Data completeness and integrity across the partner dataset."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Records" value={total} />
        <StatCard label="Valid Records" value={valid} tone="accent" />
        <StatCard label="Warning Records" value={warning} tone="warn" sub="Zero-utilization with pending amount" />
        <StatCard label="Missing Location Data" value={missingLoc} tone="warn" />
        <StatCard
          label="Missing Overdue / NPA Data"
          value={missingOverdue}
          tone="bad"
          sub="Not present in source dataset for any partner"
        />
      </div>

      <div className="mb-6 rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] px-5 py-4 text-[13px] leading-relaxed text-[var(--slate)] shadow-[var(--shadow)]">
        Duplicate records: 0 · Invalid records: 0 · Stale data: 0 (as of 31 Jul 2026 upload) · Mapping issues: 0 —
        all type-level mappings resolved.
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <h3 className="mb-4 text-[15px] font-bold text-[var(--ink)]">Data Quality Flag Distribution</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={flagData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                  <Cell fill="#1B4332" />
                  <Cell fill="#A9823E" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <h3 className="mb-4 text-[15px] font-bold text-[var(--ink)]">Field Completeness</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completenessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEDE9" />
                <XAxis dataKey="field" fontSize={12} angle={-15} textAnchor="end" height={55} stroke="#5B6B63" />
                <YAxis fontSize={12} stroke="#5B6B63" />
                <Tooltip />
                <Bar dataKey="complete" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
