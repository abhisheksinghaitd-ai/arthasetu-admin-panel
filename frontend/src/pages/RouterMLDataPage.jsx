import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import DataTable from "../components/DataTable.jsx";
import { NA, fmtPct, effectiveStatus, statusChip, locationChip, dqChip } from "../lib/format.js";
import { downloadCsv } from "../lib/csv.js";

const EXPORT_HEADERS = [
  { key: "partner_id", label: "Partner ID" },
  { key: "partner_name", label: "Partner Name" },
  { key: "utilization_pct", label: "Fund Util %" },
  { key: "type_based_scheme_count", label: "Scheme Compatibility (type-level)" },
  { key: "active_status", label: "Active Status" },
  { key: "location_status", label: "Location Status" },
  { key: "data_quality_flag", label: "Data Quality" },
  { key: "as_of_date", label: "Last Updated" },
];

/* Ported from legacy RouterMLDataPage({partners}), lines ~1603-1631. */
export default function RouterMLDataPage({ partners }) {
  const columns = [
    { key: "partner_id", label: "PARTNER ID" },
    { key: "partner_name", label: "PARTNER NAME" },
    { key: "_distance", label: "DISTANCE", sortable: false, render: () => <NA label="No user location" /> },
    { key: "utilization_pct", label: "FUND UTIL %", render: (r) => fmtPct(r.utilization_pct, 1) },
    { key: "overdue_ratio", label: "OVERDUE RATIO", sortable: false, render: () => <NA /> },
    {
      key: "type_based_scheme_count",
      label: "SCHEME COMPATIBILITY",
      render: (r) => `${r.type_based_scheme_count} (type-level)`,
    },
    { key: "_status", label: "ACTIVE STATUS", sortable: false, render: (r) => statusChip(effectiveStatus(r)) },
    { key: "location_status", label: "LOCATION STATUS", sortable: false, render: (r) => locationChip(r) },
    { key: "data_quality_flag", label: "DATA QUALITY", sortable: false, render: (r) => dqChip(r.data_quality_flag) },
    { key: "as_of_date", label: "LAST UPDATED" },
  ];

  const missing = partners.filter((p) => !p.has_location).length;

  return (
    <div>
      <PageHeader
        title="Partner Router — ML Data"
        breadcrumb={["Partner Router", "ML Data"]}
        description="Dataset feeding the Partner Router — the same records as Partner Management, restricted to routing-relevant fields."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="TOTAL RECORDS" value={partners.length} />
        <StatCard label="MISSING VALUES (LOCATION)" value={missing} tone="warn" />
        <StatCard
          label="MISSING VALUES (OVERDUE)"
          value={partners.length}
          tone="warn"
          sub="Not present in any source"
        />
        <StatCard label="DUPLICATES DETECTED" value="0" />
        <StatCard label="OUTLIERS DETECTED" value="0" />
      </div>

      <DataTable
        columns={columns}
        rows={partners}
        rowKey="partner_id"
        title="ML data records"
        searchFields={["partner_id", "partner_name"]}
        pageSize={12}
        extraToolbar={
          <button
            className="rounded border border-[var(--sage-line)] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--ink)] hover:bg-[var(--paper)]"
            onClick={() => downloadCsv("partner-router-ml-data.csv", partners, EXPORT_HEADERS)}
          >
            Export
          </button>
        }
      />
    </div>
  );
}
