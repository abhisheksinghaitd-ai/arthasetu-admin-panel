import PageHeader from "../components/PageHeader.jsx";
import Chip from "../components/Chip.jsx";
import { NA } from "../lib/format.js";

const MODEL_DETAILS = [
  { k: "MODEL NAME", v: "Partner Ranking Model" },
  { k: "MODEL TYPE", v: "XGBoost Learning-to-Rank (planned)" },
  { k: "VERSION", v: <NA /> },
  { k: "MODEL STATUS", v: <Chip tone="amber">NOT AVAILABLE</Chip> },
  { k: "DEPLOYMENT STATUS", v: <Chip tone="slate">DISABLED</Chip> },
  { k: "TRAINING DATASET", v: "Simulation / Prototype" },
  { k: "TRAINING DATE", v: <NA /> },
  { k: "LAST UPDATED", v: <NA /> },
];

const FEATURES = [
  {
    name: "Distance",
    availability: <Chip tone="amber">MISSING</Chip>,
    note: "Requires verified partner + user coordinates — 0/92 partners have location on file",
  },
  {
    name: "Fund Utilization %",
    availability: <Chip tone="green">AVAILABLE</Chip>,
    note: "Present for all 92 partner records",
  },
  {
    name: "Overdue Ratio",
    availability: <Chip tone="amber">MISSING</Chip>,
    note: "No official overdue / NPA source connected",
  },
];

function ActionButton({ children, disabled, reason }) {
  return (
    <button
      disabled={disabled}
      title={disabled ? reason || "Unavailable — no model is currently deployed" : undefined}
      className={
        "rounded border px-4 py-2 text-[13px] font-semibold " +
        (disabled
          ? "cursor-not-allowed border-[var(--sage-line)] bg-[#F1F2EF] text-[var(--slate)] opacity-60"
          : "border-[var(--sage-line)] bg-white text-[var(--ink)] hover:bg-[var(--paper)]")
      }
    >
      {children}
    </button>
  );
}

/* Ported from legacy RouterModelPage(), lines ~1693-1740. */
export default function RouterModelPage() {
  return (
    <div>
      <PageHeader
        title="Partner Router — Model Status"
        breadcrumb={["Partner Router", "Model Status"]}
        description="Training and deployment status of the ranking model used by Partner Router."
      />

      <div className="mb-6 rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--sage-line)] px-5 py-3">
          <h3 className="text-[15px] font-bold text-[var(--ink)]">Model Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {MODEL_DETAILS.map((d) => (
            <div key={d.k}>
              <div className="mb-1 text-[11.5px] font-semibold tracking-wide text-[var(--slate)]">{d.k}</div>
              <div className="text-[14px] font-semibold text-[var(--ink)]">{d.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--sage-line)] px-5 py-3">
          <h3 className="text-[15px] font-bold text-[var(--ink)]">Feature List</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-[13.5px]">
            <thead>
              <tr>
                <th className="whitespace-nowrap border-b border-[var(--sage-line)] bg-[#FAFAF7] px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-[var(--slate)]">
                  FEATURE
                </th>
                <th className="whitespace-nowrap border-b border-[var(--sage-line)] bg-[#FAFAF7] px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-[var(--slate)]">
                  AVAILABILITY
                </th>
                <th className="whitespace-nowrap border-b border-[var(--sage-line)] bg-[#FAFAF7] px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-[var(--slate)]">
                  NOTE
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.name} className="border-b border-[#EFF1EE]">
                  <td className="whitespace-nowrap px-5 py-3 font-semibold text-[var(--ink)]">{f.name}</td>
                  <td className="whitespace-nowrap px-5 py-3">{f.availability}</td>
                  <td className="px-5 py-3 text-[var(--slate)]">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-[var(--rust)]/25 bg-[var(--rust-soft)] px-5 py-4 text-[13.5px] leading-relaxed text-[var(--ink)]">
        <span className="font-semibold text-[var(--rust)]">Metrics Not Available — </span>
        No trained or deployed model exists. Do not treat any score shown elsewhere in this console as a
        validated ML output; ranking previews use available data only and are explicitly labeled Simulation
        / Prototype.
      </div>

      <div className="mb-4 flex items-center gap-3">
        <h3 className="text-[15px] font-bold text-[var(--ink)]">Model Management</h3>
        <span className="h-px flex-1 bg-[var(--sage-line)]" />
      </div>
      <div className="flex flex-wrap gap-3">
        <ActionButton disabled reason="No model training pipeline is connected in this build">
          Upload Model
        </ActionButton>
        <ActionButton disabled reason="No model training pipeline is connected in this build">
          Version Model
        </ActionButton>
        <ActionButton disabled>Activate Model</ActionButton>
        <ActionButton disabled>Deactivate Model</ActionButton>
        <ActionButton disabled>Rollback Model</ActionButton>
        <ActionButton disabled reason="No trained model exists to inspect">
          View Feature Importance
        </ActionButton>
      </div>
    </div>
  );
}
