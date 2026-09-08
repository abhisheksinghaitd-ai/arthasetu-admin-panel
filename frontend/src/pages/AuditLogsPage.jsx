import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Chip from "../components/Chip.jsx";

/* ---------------------------------------------------------------
   AuditLogsPage — props {log}
   Ported from legacy AuditLogsPage (~line 2044). Append-only trail
   of scheme changes, partner status changes, data imports, and
   admin actions — a core due-process artifact for a government
   system, so it stays a plain, complete, searchable table.
   --------------------------------------------------------------- */
export default function AuditLogsPage({ log = [] }) {
  const columns = [
    { key: "time", label: "TIME" },
    {
      key: "category",
      label: "CATEGORY",
      render: (r) => <Chip tone="slate">{r.category}</Chip>,
    },
    { key: "event", label: "EVENT" },
    { key: "by", label: "PERFORMED BY" },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        breadcrumb={["Audit Logs"]}
        description="Full history of scheme changes, partner status changes, data imports, and admin actions. This record is append-only and cannot be edited or deleted from the console."
      />
      <DataTable
        columns={columns}
        rows={log}
        rowKey="time"
        title="audit entries"
        searchFields={["event", "category", "by"]}
        pageSize={14}
      />
    </div>
  );
}
