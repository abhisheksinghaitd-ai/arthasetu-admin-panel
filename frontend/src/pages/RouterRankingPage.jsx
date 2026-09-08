import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { SCHEMES } from "../lib/demoData.js";
import { NA, fmtPct, effectiveStatus, statusChip } from "../lib/format.js";

/* Ported from legacy RouterRankingPage({partners}), lines ~1633-1691. */
export default function RouterRankingPage({ partners }) {
  const [schemeSel, setSchemeSel] = useState(SCHEMES[0].scheme_id);
  const scheme = SCHEMES.find((s) => s.scheme_id === schemeSel);
  const allowedTypes = scheme.allowed_channel_partners
    .split(",")
    .map((s) => s.trim().replace(/NBFC-MFI/i, "NBFCI-MFI"));
  const eligible = partners.filter((p) => allowedTypes.includes(p.partner_type));
  const activeCount = eligible.filter((p) => effectiveStatus(p) === "ACTIVE").length;
  const blockedCount = eligible.filter((p) => effectiveStatus(p) === "BLOCKED").length;
  const withLoc = eligible.filter((p) => p.has_location).length;

  // Rank by utilization_pct only (the sole available validated feature) — a transparent,
  // non-fabricated proxy. No distance or overdue values are invented to fill the gap.
  const ranked = [...eligible]
    .filter((p) => effectiveStatus(p) !== "BLOCKED" && effectiveStatus(p) !== "INACTIVE")
    .sort((a, b) => (b.utilization_pct || 0) - (a.utilization_pct || 0))
    .slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Partner Router — Ranking Results"
        breadcrumb={["Partner Router", "Ranking Results"]}
        description="Simulated ranking preview using only validated, available fields — no fabricated distance or overdue values."
      />

      <div className="mb-6 rounded-lg border border-[var(--amber)]/25 bg-[var(--amber-soft)] px-5 py-4 text-[13.5px] leading-relaxed text-[var(--ink)]">
        <span className="font-semibold text-[var(--amber)]">Prototype — </span>
        No trained XGBoost ranking model is deployed. This view demonstrates the intended output using Fund
        Utilization % as the only currently available, validated feature. Distance and Overdue Ratio show as
        Not Available until location and overdue data are provided.
      </div>

      <div className="mb-6 max-w-sm">
        <label className="mb-1.5 block text-[12.5px] font-semibold tracking-wide text-[var(--slate)]">
          SCHEME
        </label>
        <select
          className="w-full rounded border border-[var(--sage-line)] bg-white px-3 py-2 text-[13.5px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:outline-none"
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

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="SELECTED SCHEME" value={scheme.scheme_id} />
        <StatCard label="USER LOCATION" value={<NA label="Not provided" />} />
        <StatCard label="ELIGIBLE PARTNER COUNT" value={eligible.length} />
        <StatCard label="ACTIVE PARTNER COUNT" value={activeCount} tone="accent" />
        <StatCard label="BLOCKED PARTNER COUNT" value={blockedCount} tone="bad" />
        <StatCard label="PARTNERS WITH VALID LOCATION" value={withLoc} tone="warn" />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <h3 className="text-[15px] font-bold text-[var(--ink)]">Top Ranked Partners</h3>
        <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--slate)]">
          Simulation / Prototype
        </span>
        <span className="h-px flex-1 bg-[var(--sage-line)]" />
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
          <EmptyState
            title="No eligible partners"
            description="No active, non-blocked partners match this scheme's allowed channel-partner type."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ranked.map((p, i) => (
            <div
              key={p.partner_id}
              className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--green-soft)] text-[14px] font-bold text-[var(--green-deep)]">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-[14.5px] font-bold text-[var(--ink)]">{p.partner_name}</div>
                    <div className="text-[12.5px] text-[var(--slate)]">
                      {p.partner_id} · {p.partner_type} · {p.state}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-center">
                    <div className="text-[11px] font-semibold tracking-wide text-[var(--slate)]">DISTANCE</div>
                    <NA />
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold tracking-wide text-[var(--slate)]">FUND UTIL %</div>
                    <div className="text-[13.5px] font-bold text-[var(--ink)]">
                      {fmtPct(p.utilization_pct, 1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold tracking-wide text-[var(--slate)]">
                      OVERDUE RATIO
                    </div>
                    <NA />
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold tracking-wide text-[var(--slate)]">ML SCORE</div>
                    <NA label="No model" />
                  </div>
                  {statusChip(effectiveStatus(p))}
                </div>
              </div>
              <div className="border-t border-[var(--sage-line)] px-5 py-2.5 text-[12.5px] leading-relaxed text-[var(--slate)]">
                Reason: ordered by fund utilization percentage — the only validated feature currently
                available. Distance- and overdue-based ranking will apply once location and overdue data are
                added.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
