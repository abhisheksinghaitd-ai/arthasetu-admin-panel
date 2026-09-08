import { useState } from "react";
import { Upload } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import Chip from "../components/Chip.jsx";
import DataTable from "../components/DataTable.jsx";

const HISTORY = [
  {
    file: "DOC-20260904-WA0016__1_.csv",
    type: "Scheme Master",
    records: 12,
    newR: 12,
    upd: 0,
    dup: 0,
    inv: 0,
    by: "System",
    date: "2026-09-04",
    source: "Official CSV Upload",
  },
  {
    file: "partner_router_master_dataset.xlsx",
    type: "Partner Router Master",
    records: 92,
    newR: 92,
    upd: 0,
    dup: 0,
    inv: 0,
    by: "System",
    date: "2026-09-04",
    source: "Official XLSX Upload",
  },
];

const HISTORY_COLUMNS = [
  { key: "file", label: "File", render: (h) => <span className="font-mono text-[13px]">{h.file}</span> },
  { key: "type", label: "Dataset Type" },
  { key: "records", label: "Records" },
  { key: "newR", label: "New" },
  { key: "upd", label: "Updated" },
  { key: "dup", label: "Duplicate" },
  { key: "inv", label: "Invalid" },
  { key: "by", label: "Uploaded By" },
  { key: "date", label: "Date" },
  { key: "source", label: "Source", render: (h) => <Chip tone="brass">{h.source}</Chip> },
];

/* ---------------------------------------------------------------
   CsvImportPage — bulk dataset upload with full validation before
   any database change (no silent overwrites). Ported from legacy
   CsvImportPage({user}).
   --------------------------------------------------------------- */
export default function CsvImportPage({ user }) {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(0);

  return (
    <div>
      <PageHeader
        title="CSV Import Center"
        breadcrumb={["Data Management", "CSV Import"]}
        description="Upload CSV/XLSX datasets with full validation before any database change. No silent overwrites."
      />

      <div className="mb-10 rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--sage-line)] px-5 py-4">
          <h3 className="text-[15px] font-bold text-[var(--ink)]">New Import</h3>
        </div>
        <div className="p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--sage-line)] bg-[#FCFCFA] px-6 py-10 text-center hover:bg-[#F7F7F4]">
            <Upload size={26} strokeWidth={1.5} className="mb-3 text-[var(--slate)]" />
            <div className="mb-3 text-[13.5px] text-[var(--slate)]">
              Drag and drop a .csv or .xlsx file, or click to browse
            </div>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="text-[13px]"
              onChange={(e) => {
                setFile(e.target.files[0]);
                setStep(1);
              }}
            />
          </label>

          {step >= 1 && file && (
            <div className="mt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem k="File Name" v={file.name} />
                <DetailItem k="Uploaded By" v={user.name} />
                <DetailItem k="Upload Date" v={new Date().toLocaleDateString("en-IN")} />
                <DetailItem k="Source" v="Manual Upload" />
              </div>
              <button
                className="mt-5 rounded bg-[var(--green-mid)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--green-deep)]"
                onClick={() => setStep(2)}
              >
                Run Validation
              </button>
            </div>
          )}

          {step >= 2 && (
            <div className="mt-7">
              <div className="mb-3 flex items-center gap-3">
                <h4 className="text-[13.5px] font-bold tracking-wide text-[var(--ink)]">Data Quality Report</h4>
                <div className="h-px flex-1 bg-[var(--sage-line)]" />
              </div>
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Column Validation" value={<Chip tone="green">PASSED</Chip>} />
                <StatCard label="Data Type Validation" value={<Chip tone="green">PASSED</Chip>} />
                <StatCard
                  label="Missing Values"
                  value="Flagged"
                  sub="See field-level Not Available tags"
                />
                <StatCard label="Duplicate Records" value="0" />
              </div>
              <button
                className="rounded bg-[var(--green-mid)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--green-deep)]"
                onClick={() => setStep(3)}
              >
                Confirm &amp; Import
              </button>
            </div>
          )}

          {step >= 3 && (
            <div className="mt-6 rounded border border-[var(--sage-line)] bg-[var(--green-soft)] px-4 py-3 text-[13.5px] text-[var(--ink)]">
              Import committed. Entry added to import history below and Audit Logs.
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-[15px] font-bold text-[var(--ink)]">Import History</h2>
        <div className="h-px flex-1 bg-[var(--sage-line)]" />
      </div>
      <DataTable
        title="import history"
        columns={HISTORY_COLUMNS}
        rows={HISTORY}
        rowKey="file"
        pageSize={10}
        searchFields={["file", "type", "by", "source"]}
      />
    </div>
  );
}

function DetailItem({ k, v }) {
  return (
    <div>
      <div className="text-[11.5px] font-semibold tracking-wide text-[var(--slate)]">{k.toUpperCase()}</div>
      <div className="mt-0.5 text-[13.5px] text-[var(--ink)]">{v}</div>
    </div>
  );
}
