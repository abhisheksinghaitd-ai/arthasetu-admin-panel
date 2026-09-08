import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { SCHEMES } from "../lib/demoData.js";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Chip from "../components/Chip.jsx";

/* ---------------------------------------------------------------
   SchemeMappingPage — type-level scheme <-> channel-partner
   compatibility. Ported from legacy SchemeMappingPage
   (lines ~1505-1547).
   --------------------------------------------------------------- */
export default function SchemeMappingPage({ partners }) {
  const [schemeSel, setSchemeSel] = useState(SCHEMES[0].scheme_id);
  const scheme = SCHEMES.find((s) => s.scheme_id === schemeSel);
  const allowedTypes = scheme.allowed_channel_partners.split(",").map((s) => s.trim());
  // normalize NBFC-MFI vs NBFCI-MFI naming difference between the two source files
  const normType = (t) => t.replace(/NBFC-MFI/i, "NBFCI-MFI");
  const matched = (partners || []).filter((p) => allowedTypes.map(normType).includes(p.partner_type));

  const columns = [
    { key: "partner_id", label: "Partner ID" },
    { key: "partner_name", label: "Partner Name" },
    { key: "partner_type", label: "Type" },
    { key: "state", label: "State" },
    { key: "_mapstatus", label: "Mapping Status", render: () => <Chip tone="amber">TYPE-LEVEL MATCH</Chip> },
    { key: "_auth", label: "Verified Authorization", render: () => <Chip tone="slate">PENDING VERIFICATION</Chip> },
  ];

  const steps = [
    { label: `Scheme: ${scheme.scheme_name}`, tone: "default" },
    { label: `Allowed Partner Type(s): ${scheme.allowed_channel_partners}`, tone: "filter" },
    { label: `Eligible Channel Partners: ${matched.length}`, tone: "default" },
    { label: "Verified Authorization Status: Pending Verification (all)", tone: "output" },
  ];

  return (
    <div>
      <PageHeader
        title="Scheme–Partner Mapping"
        breadcrumb={["Partners", "Scheme Mapping"]}
        description="Type-level compatibility between schemes and channel-partner categories."
      />

      <div className="mb-4 rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex w-full flex-col items-center">
              <div
                className={
                  "w-full rounded-lg border px-4 py-3 text-center text-[13.5px] font-medium " +
                  (s.tone === "filter"
                    ? "border-[var(--amber-soft)] bg-[var(--amber-soft)]/40 text-[var(--ink)]"
                    : s.tone === "output"
                    ? "border-[var(--brass)] bg-[var(--brass-soft)] font-semibold text-[var(--ink)]"
                    : "border-[var(--sage-line)] bg-white text-[var(--ink)]")
                }
              >
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <div className="py-1 text-[var(--slate)]">
                  <ArrowDown size={15} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded border border-[var(--amber-soft)] bg-[var(--amber-soft)]/40 px-4 py-3 text-[13px] leading-relaxed text-[var(--ink)]">
        Type-level match from scheme data; not proof of individual partner authorization.
      </div>

      <div className="mb-4">
        <select
          className="rounded border border-[var(--sage-line)] bg-white px-3 py-2 text-[13px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:outline-none"
          value={schemeSel}
          onChange={(e) => setSchemeSel(e.target.value)}
        >
          {SCHEMES.map((s) => (
            <option key={s.scheme_id} value={s.scheme_id}>
              {s.scheme_name}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={matched}
        rowKey="partner_id"
        title="mapped partners"
        searchFields={["partner_id", "partner_name", "state"]}
        pageSize={12}
      />
    </div>
  );
}
