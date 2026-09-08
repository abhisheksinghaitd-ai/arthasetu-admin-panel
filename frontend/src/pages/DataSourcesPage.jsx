import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Chip from "../components/Chip.jsx";
import { DATA_SOURCES } from "../lib/demoData.js";

/* ---------------------------------------------------------------
   DataSourcesPage — full traceability for every dataset feeding
   this console. Ported from legacy DataSourcesPage(). No props.
   --------------------------------------------------------------- */
const COLUMNS = [
  { key: "name", label: "Source Name" },
  { key: "type", label: "Type" },
  { key: "authority", label: "Authority" },
  { key: "dataset", label: "Dataset" },
  { key: "version", label: "Version" },
  { key: "retrieved", label: "Retrieved" },
  { key: "verified", label: "Last Verified" },
  { key: "by", label: "Updated By" },
  {
    key: "status",
    label: "Status",
    render: (d) => <Chip tone={d.status === "ACTIVE" ? "green" : "slate"}>{d.status.replace("_", " ")}</Chip>,
  },
];

export default function DataSourcesPage() {
  return (
    <div>
      <PageHeader
        title="Data Sources"
        breadcrumb={["Data Management", "Data Sources"]}
        description="Full traceability for every dataset feeding this console — origin, authority, version and last verification."
      />
      <DataTable
        title="data sources"
        columns={COLUMNS}
        rows={DATA_SOURCES}
        rowKey="name"
        pageSize={10}
        searchFields={["name", "type", "authority", "dataset", "status"]}
      />
    </div>
  );
}
