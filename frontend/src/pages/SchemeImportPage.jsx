import { useState } from "react";
import { Upload } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import Chip from "../components/Chip.jsx";

/* ---------------------------------------------------------------
   SchemeImportPage — ported from legacy SchemeImportPage
   (lines ~1212-1271). Upload -> validate/preview -> confirm import,
   plus a static import-history record. No backend call exists yet
   in the legacy source either — this is a client-side simulation
   of the review-before-commit workflow.
   --------------------------------------------------------------- */
export default function SchemeImportPage({ user }) {
  const [file, setFile] = useState(null);
  const [imported, setImported] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div>
      <PageHeader
        title="Scheme Import"
        breadcrumb={["Schemes", "Scheme Import"]}
        description="Upload a scheme master CSV or XLSX. Preview and validate before committing to the database — no silent overwrites."
      />

      <div className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--sage-line)] px-5 py-4">
          <h3 className="text-[14.5px] font-bold text-[var(--ink)]">Upload File</h3>
        </div>
        <div className="px-5 py-5">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[var(--sage-line)] bg-[#FCFCFA] px-6 py-9 text-center hover:border-[var(--green-mid)]">
            <Upload size={24} strokeWidth={1.5} className="text-[var(--slate)]" />
            <div className="text-[13.5px] text-[var(--slate)]">Drag and drop a .csv or .xlsx file, or click to browse</div>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files[0] || null);
                setImported(false);
                setConfirmed(false);
              }}
            />
          </label>

          {file && (
            <div className="mt-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <div>
                  <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--slate)]">File Name</div>
                  <div className="mt-1 text-[14px] font-medium text-[var(--ink)]">{file.name}</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--slate)]">Dataset Type</div>
                  <div className="mt-1 text-[14px] font-medium text-[var(--ink)]">Scheme Master</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--slate)]">Uploaded By</div>
                  <div className="mt-1 text-[14px] font-medium text-[var(--ink)]">{user?.name}</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--slate)]">Upload Date</div>
                  <div className="mt-1 text-[14px] font-medium text-[var(--ink)]">
                    {new Date().toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>
              <button
                className="mt-5 rounded bg-[var(--green-mid)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--green-deep)]"
                onClick={() => setImported(true)}
              >
                Validate &amp; Preview
              </button>
            </div>
          )}

          {imported && (
            <div className="mt-6">
              <div className="rounded border border-[var(--brass-soft)] bg-[var(--brass-soft)]/40 px-4 py-3 text-[13px] leading-relaxed text-[var(--ink)]">
                Preview complete. Review the report below, then confirm to commit to the database.
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Records Found" value="12" />
                <StatCard label="New Records" value="0" />
                <StatCard label="Updated Records" value="0" tone="accent" />
                <StatCard label="Invalid Records" value="0" />
              </div>
              <button
                className="mt-4 rounded bg-[var(--green-mid)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--green-deep)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setConfirmed(true)}
                disabled={confirmed}
              >
                {confirmed ? "Imported" : "Confirm Import"}
              </button>
              {confirmed && (
                <div className="mt-4 rounded border border-[var(--sage-line)] bg-[var(--green-soft)] px-4 py-3 text-[13.5px] text-[var(--ink)]">
                  Import committed. This action has been recorded in the audit log.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 mt-8 flex items-center gap-3">
        <h3 className="text-[13.5px] font-bold uppercase tracking-wide text-[var(--green-deep)]">Import History</h3>
        <span className="h-px flex-1 bg-[var(--sage-line)]" />
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["File Name", "Dataset", "Records", "Uploaded By", "Date", "Source"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap border-b border-[var(--sage-line)] bg-[#FAFAF7] px-4 py-3 text-left text-[12px] font-semibold tracking-wide text-[var(--slate)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#EFF1EE]">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-[var(--ink)]">
                  DOC-20260904-WA0016__1_.csv
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--ink)]">Scheme Master</td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--ink)]">12</td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--ink)]">System (Initial Load)</td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--ink)]">2026-09-04</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Chip tone="brass">Official CSV Upload</Chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
