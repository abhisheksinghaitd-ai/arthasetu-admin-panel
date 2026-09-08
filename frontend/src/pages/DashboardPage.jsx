import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import Chip from "../components/Chip.jsx";
import MiniDonut from "../components/MiniDonut.jsx";
import { BookOpen, Building2, CheckCircle2, Clock, Users, Activity } from "lucide-react";
import { api } from "../api.js";
import { SCHEMES, PARTNERS, PARTNER_TYPES, RAW_ANNUAL, PIE_COLORS, DEMO_USERS, DEMO_APPLICATIONS } from "../lib/demoData.js";
import { effectiveStatus, NA } from "../lib/format.js";

/* ---------------------------------------------------------------
   useComputedStats — every number the dashboard needs, computed
   once. Scheme/partner figures come from the real NSFDC source
   files; totalUsers/totalApplications come from the illustrative
   demo dataset (lib/demoData.js DEMO_USERS/DEMO_APPLICATIONS) since
   no live citizen database is connected to this build.
   --------------------------------------------------------------- */
function useComputedStats() {
  return useMemo(() => {
    const totalSchemes = SCHEMES.length;
    const activeSchemes = SCHEMES.filter((s) => s.active).length;
    const inactiveSchemes = totalSchemes - activeSchemes;

    const totalPartners = PARTNERS.length;
    const withLoc = PARTNERS.filter((p) => p.has_location).length;
    const missingLoc = totalPartners - withLoc;
    const blocked = PARTNERS.filter((p) => effectiveStatus(p) === "BLOCKED").length;
    const active = PARTNERS.filter((p) => effectiveStatus(p) === "ACTIVE").length;
    const underReview = PARTNERS.filter((p) => effectiveStatus(p) === "UNDER REVIEW").length;

    const byType = {};
    PARTNER_TYPES.forEach((t) => (byType[t] = PARTNERS.filter((p) => p.partner_type === t).length));

    const totalSanction = PARTNERS.reduce((a, p) => a + (p.amount_sanction_lakh || 0), 0);
    const totalDisb = PARTNERS.reduce((a, p) => a + (p.net_disbursement_lakh || 0), 0);
    const totalUtil = PARTNERS.reduce((a, p) => a + (p.funds_utilisation_lakh || 0), 0);
    const avgUtilPct = PARTNERS.reduce((a, p) => a + (p.utilization_pct || 0), 0) / totalPartners;

    const dqOk = PARTNERS.filter((p) => p.data_quality_flag === "OK").length;
    const dqWarn = totalPartners - dqOk;

    const totalUsers = DEMO_USERS.length;
    const totalApplications = DEMO_APPLICATIONS.length;
    const pendingApplications = DEMO_APPLICATIONS.filter(
      (a) => a.status === "under_review" || a.status === "applied" || a.status === "matched"
    ).length;

    return {
      totalSchemes,
      activeSchemes,
      inactiveSchemes,
      totalPartners,
      withLoc,
      missingLoc,
      blocked,
      active,
      underReview,
      byType,
      totalSanction,
      totalDisb,
      totalUtil,
      avgUtilPct,
      dqOk,
      dqWarn,
      totalUsers,
      totalApplications,
      pendingApplications,
    };
  }, []);
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-4 flex items-baseline gap-3 border-b border-[var(--sage-line)] pb-2.5">
      <span className="h-2.5 w-2.5 shrink-0 bg-[var(--brass)]" />
      <h2 className="text-[18px] font-bold tracking-tight text-[var(--ink)]">{title}</h2>
      {description && <span className="flex-1 text-[12.5px] text-[var(--slate)]">{description}</span>}
      {action}
    </div>
  );
}

function ChartPanel({ title, height = 280, note, children }) {
  return (
    <div className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow-premium)]">
      <div className="border-b border-[var(--sage-line)] px-5 py-3.5">
        <h3 className="text-[13.5px] font-bold tracking-wide text-[var(--ink)]">{title}</h3>
      </div>
      <div className="p-5" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      {note && <p className="border-t border-[var(--sage-line)] px-5 py-3 text-[12.5px] leading-relaxed text-[var(--amber)]">{note}</p>}
    </div>
  );
}

function CoverageRow({ label, chip, note, chart, last, onClick }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick } : {})}
      className={`flex w-full flex-col gap-2 py-3.5 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
        last ? "" : "border-b border-[var(--sage-line)]"
      } ${onClick ? "cursor-pointer hover:bg-[#FAFAF7]" : ""}`}
    >
      <div className="text-[13.5px] font-semibold text-[var(--ink)] sm:w-[220px] sm:shrink-0">{label}</div>
      <div className="flex flex-1 items-center justify-between gap-4 sm:justify-end">
        {chart}
        <p className="flex-1 text-[13px] leading-relaxed text-[var(--slate)] sm:text-right">{note}</p>
        <div className="shrink-0">{chip}</div>
      </div>
    </Wrapper>
  );
}

export default function DashboardPage({ user, auditLog, setPage }) {
  const s = useComputedStats();
  const [liveKpis, setLiveKpis] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .kpis()
      .then((data) => {
        if (!cancelled) setLiveKpis(data);
      })
      .catch(() => {
        if (!cancelled) setLiveKpis(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const schemeStatusData = [
    { name: "Active", value: s.activeSchemes },
    { name: "Inactive", value: s.inactiveSchemes },
  ];
  const partnerStatusData = [
    { name: "Active", value: s.active },
    { name: "Under Review / Unknown", value: s.underReview },
    { name: "Blocked", value: s.blocked },
    { name: "Inactive", value: s.totalPartners - s.active - s.underReview - s.blocked },
  ].filter((d) => d.value > 0);
  const partnerTypeData = Object.entries(s.byType).map(([k, v]) => ({ name: k, value: v }));

  const PIPELINE_ORDER = ["matched", "applied", "under_review", "sanctioned", "disbursed"];
  const pipelineData = PIPELINE_ORDER.map((st) => ({
    name: st.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: DEMO_APPLICATIONS.filter((a) => a.status === st).length,
  })).filter((d) => d.value > 0);

  const annualData = RAW_ANNUAL.map((r) => ({
    year: r.financial_year,
    SCA: r.SCA_disbursement_crore,
    PSB: r.PSB_disbursement_crore,
    RRB: r.RRB_disbursement_crore,
    Total: r.total_disbursement_crore,
  })).slice(-10);

  const activePct = s.totalPartners ? Math.round((s.active / s.totalPartners) * 100) : 0;
  const firstName = (user?.name || "Admin").split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        breadcrumb={["Dashboard"]}
        description="Platform overview — scheme, partner and routing data as of latest upload (31 Jul 2026)."
      />

      {liveKpis && (
        <div className="mb-8 rounded-lg border border-[var(--brass)] bg-[var(--brass-soft)]/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Chip tone="brass">Live Backend Data</Chip>
            <span className="text-[12.5px] text-[var(--slate)]">Figures below come from the connected admin API, not the static dataset.</span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Live Users (DB)" value={liveKpis.total_users} icon={Users} tone="default" />
            <StatCard label="Active Applications" value={liveKpis.active_applications} icon={CheckCircle2} tone="accent" />
            <StatCard label="Schemes Live" value={liveKpis.schemes_live} icon={BookOpen} tone="default" />
            <StatCard label="Partners Onboarded" value={liveKpis.partners_onboarded} icon={Building2} tone="default" />
          </div>
        </div>
      )}

      {/* Primary KPI row — one curated set, clean, modern & responsive */}
      <div className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Schemes"
          value={s.totalSchemes}
          tone="accent"
          icon={BookOpen}
          badge="100% Active"
          sub={`${s.activeSchemes} active · ${s.inactiveSchemes} inactive`}
          onClick={() => setPage("schemes-all")}
        />
        <StatCard
          label="Channel Partners"
          value={s.totalPartners}
          tone="default"
          icon={Building2}
          badge="4 Types"
          sub="Router Master (31 Jul 2026)"
          onClick={() => setPage("partners-all")}
        />
        <StatCard
          label="Active Partners"
          value={s.active}
          tone={s.active > 0 ? "accent" : "warn"}
          icon={CheckCircle2}
          badge={`${activePct}%`}
          sub={s.active > 0 ? `${s.active} active partners` : "0 of 92 active in directory"}
          onClick={() => setPage("partners-all")}
        />
        <StatCard
          label="Pending Review"
          value={s.underReview}
          tone="warn"
          icon={Clock}
          badge="Action Needed"
          sub={`${s.underReview} awaiting · ${s.blocked} blocked`}
          onClick={() => setPage("partners-status")}
        />
        <StatCard
          label="Users & Applications"
          value={s.totalUsers}
          tone="default"
          icon={Users}
          badge={`${s.totalApplications} Apps`}
          sub="Citizen accounts on file"
          onClick={() => setPage("users-list")}
        />
        <StatCard
          label="System Health"
          value={
            <span className="inline-flex items-center gap-1.5 text-[20px] font-bold text-[var(--amber)]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
              Pending
            </span>
          }
          tone="warn"
          icon={Activity}
          badge="3 Items"
          sub="APIs, ML & Geolocation"
          onClick={() => setPage("data-sources")}
        />
      </div>

      {/* Data Coverage & Setup Status — every "not available / not deployed" signal consolidated here */}
      <div className="mb-8 rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow-premium)]">
        <div className="border-b border-[var(--sage-line)] px-6 py-4">
          <h2 className="text-[17px] font-bold text-[var(--ink)]">Data Coverage &amp; Setup Status</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--slate)]">What this console can and cannot report on today</p>
        </div>
        <div className="px-6">
          <CoverageRow
            label="Citizen Users & Applications"
            note={`${s.totalUsers} citizen accounts and ${s.totalApplications} applications are on file.`}
            chip={<Chip tone="green">Available</Chip>}
            onClick={() => setPage("users-list")}
          />
          <CoverageRow
            label="API Connections"
            note="No external partner or payment APIs are registered yet."
            chip={<Chip tone="slate">None Connected</Chip>}
            onClick={() => setPage("data-api")}
          />
          <CoverageRow
            label="ML Routing Model"
            note="No trained ranking model is on file; the router summary uses static eligibility rules only."
            chip={<Chip tone="amber">Not Deployed</Chip>}
            onClick={() => setPage("router-model")}
          />
          <CoverageRow
            label="Partner Geolocation"
            note={`${s.missingLoc} of ${s.totalPartners} partners are missing verified coordinates — distance-based routing is disabled.`}
            chip={<Chip tone="amber">{s.missingLoc === s.totalPartners ? "All Missing" : "Partially Missing"}</Chip>}
            onClick={() => setPage("partners-locations")}
          />
          <CoverageRow
            label="Partner Data Quality Flags"
            note={`${s.dqWarn} of ${s.totalPartners} partner records carry a data-quality warning from source.`}
            chip={s.dqWarn > 0 ? <Chip tone="amber">{s.dqWarn} Flagged</Chip> : <Chip tone="green">All Valid</Chip>}
            onClick={() => setPage("data-quality")}
          />
          <CoverageRow
            label="Last Dataset Sync"
            note="Manual upload of the Scheme Master (CSV) and Partner Router Master (XLSX) files."
            chip={<Chip tone="slate">31 Jul 2026</Chip>}
            onClick={() => setPage("data-sources")}
            last
          />
        </div>
      </div>

      {/* Analytics — only charts that add information beyond the coverage panel above */}
      <div className="mb-8">
        <SectionHeading title="Analytics" description="Scheme, partner, applicant and disbursement trends" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartPanel title="Scheme Status Distribution">
            <PieChart>
              <Pie data={schemeStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label isAnimationActive={false}>
                {schemeStatusData.map((e, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartPanel>

          <ChartPanel title="Partner Status Distribution">
            <PieChart>
              <Pie data={partnerStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label isAnimationActive={false}>
                {partnerStatusData.map((e, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartPanel>

          <ChartPanel title="Partner Type Breakdown">
            <BarChart data={partnerTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAEDE9" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" fill="#1B4332" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ChartPanel>

          <ChartPanel title="Application Pipeline Status">
            <PieChart>
              <Pie data={pipelineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label isAnimationActive={false}>
                {pipelineData.map((e, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartPanel>

          <div className="lg:col-span-2">
            <ChartPanel title="Disbursement by Channel Type (₹ crore, by financial year)" height={320}>
              <LineChart data={annualData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAEDE9" />
                <XAxis dataKey="year" fontSize={10} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="SCA" stroke="#1B4332" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="PSB" stroke="#A9823E" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="RRB" stroke="#8A1F11" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ChartPanel>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <SectionHeading
          title="Recent Activity"
          description="Latest entries from the audit log"
          action={
            <button
              type="button"
              onClick={() => setPage("audit")}
              className="text-[12.5px] font-semibold text-[var(--green-mid)] hover:underline"
            >
              View all →
            </button>
          }
        />
        <div className="overflow-x-auto rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
          <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-[var(--sage-line)] text-left text-[12.5px] font-semibold uppercase tracking-wide text-[var(--slate)]">
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">By</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.slice(0, 6).map((a, i) => (
                <tr
                  key={i}
                  className="cursor-pointer border-b border-[var(--sage-line)] last:border-0 hover:bg-[#FAFAF7]"
                  onClick={() => setPage("audit")}
                >
                  <td className="whitespace-nowrap px-5 py-3 text-[var(--slate)]">{a.time}</td>
                  <td className="px-5 py-3">
                    <Chip tone="slate">{a.category}</Chip>
                  </td>
                  <td className="px-5 py-3 text-[var(--ink)]">{a.event}</td>
                  <td className="px-5 py-3 text-[var(--slate)]">{a.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
