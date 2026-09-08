import { ArrowDown } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import Chip from "../components/Chip.jsx";
import { NA, effectiveStatus } from "../lib/format.js";

/* ---------------------------------------------------------------
   Routing pipeline, ported step-for-step from the legacy
   RouterOverviewPage flow-diagram. `kind` drives visual emphasis:
   "filter" = a rule-based gate (not an ML feature), "model" = the
   ranking model itself, "output" = final recommendation.
   --------------------------------------------------------------- */
const FLOW_STEPS = [
  { label: "User", kind: "plain" },
  { label: "Selected Scheme", kind: "plain" },
  { label: "Scheme Compatibility Filter", note: "Pre-filter — not an ML feature", kind: "filter" },
  { label: "Eligible Partners", kind: "plain" },
  { label: "Active / Unblocked Filter", kind: "filter" },
  { label: "Location Availability", kind: "filter" },
  { label: "Distance Calculation", kind: "plain" },
  { label: "ML Features", note: "Distance · Fund Utilization % · Overdue Ratio", kind: "plain" },
  { label: "XGBoost Ranking Model", note: "Not yet trained — see Model Status", kind: "model" },
  { label: "Partner Score", kind: "plain" },
  { label: "Top-N Partners", kind: "plain" },
  { label: "Recommended Partner", kind: "output" },
];

const STEP_STYLE = {
  plain: "border-[var(--sage-line)] bg-white text-[var(--ink)]",
  filter: "border-[var(--brass)] bg-[var(--brass-soft)] text-[var(--ink)]",
  model: "border-dashed border-[var(--slate)] bg-white text-[var(--ink)]",
  output: "border-[var(--green-mid)] bg-[var(--green-mid)] text-white",
};

function FlowDiagram({ steps }) {
  return (
    <ol className="mx-auto flex max-w-xl flex-col items-stretch">
      {steps.map((s, i) => (
        <li key={s.label} className="flex flex-col items-center">
          <div
            className={`w-full rounded-lg border px-5 py-3 text-center text-[13.5px] font-semibold ${STEP_STYLE[s.kind] || STEP_STYLE.plain}`}
          >
            {s.label}
            {s.note && (
              <div
                className={`mt-1 text-[12px] font-normal ${s.kind === "output" ? "text-white/80" : "text-[var(--slate)]"}`}
              >
                {s.note}
              </div>
            )}
          </div>
          {i < steps.length - 1 && (
            <div className="py-1 leading-none text-[var(--sage-line)]">
              <ArrowDown size={16} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

/* Ported from legacy RouterOverviewPage({partners}), lines ~1549-1601. */
export default function RouterOverviewPage({ partners }) {
  const withLoc = partners.filter((p) => p.has_location).length;
  const active = partners.filter((p) => effectiveStatus(p) === "ACTIVE").length;
  const blocked = partners.filter((p) => effectiveStatus(p) === "BLOCKED").length;

  return (
    <div>
      <PageHeader
        title="Partner Router — Overview"
        breadcrumb={["Partner Router", "Overview"]}
        description="How a citizen's scheme selection becomes a ranked list of recommended channel partners."
      />

      <div className="mb-6 rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--sage-line)] px-5 py-3">
          <h3 className="text-[15px] font-bold text-[var(--ink)]">Routing Workflow</h3>
        </div>
        <div className="px-5 py-8">
          <FlowDiagram steps={FLOW_STEPS} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="TOTAL ELIGIBLE PARTNERS" value={partners.length} />
        <StatCard label="ACTIVE PARTNER COUNT" value={active} tone="accent" />
        <StatCard label="BLOCKED PARTNER COUNT" value={blocked} tone="bad" />
        <StatCard
          label="PARTNERS WITH VALID LOCATION"
          value={withLoc}
          tone={withLoc === 0 ? "bad" : "accent"}
        />
        <StatCard label="ML MODEL VERSION" value={<NA label="No trained model" />} />
        <StatCard label="ROUTING STATUS" value={<Chip tone="amber">LOCATION-LIMITED</Chip>} />
      </div>

      <div className="rounded-lg border border-[var(--rust)]/25 bg-[var(--rust-soft)] px-5 py-4 text-[13.5px] leading-relaxed text-[var(--ink)]">
        <span className="font-semibold text-[var(--rust)]">Limitation — </span>
        Distance-based ranking cannot run: 0 of {partners.length} partners have verified coordinates. Overdue
        Ratio is unavailable for all partners. The ranking model can currently use Fund Utilization % only,
        once locations are added.
      </div>
    </div>
  );
}
