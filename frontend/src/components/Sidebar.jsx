import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Route,
  Users,
  Database,
  ClipboardList,
  Flag,
  Settings,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { NAV } from "../lib/demoData.js";

/* ---------------------------------------------------------------
   Sidebar — props {page, setPage, open, onClose, user}
   Collapsible nav groups (smooth height animation via a grid-rows
   trick), only the group containing the active page opens by
   default. Dashboard gets a standout treatment as the home/primary
   destination. A pinned footer keeps the bottom of the rail from
   reading as dead empty space when few groups are expanded.
   --------------------------------------------------------------- */
const ICONS = {
  dashboard: LayoutDashboard,
  schemes: FileText,
  partners: Building2,
  router: Route,
  users: Users,
  data: Database,
  audit: ClipboardList,
  grievances: Flag,
  settings: Settings,
};

function groupKeyForPage(page) {
  for (const item of NAV) {
    if (item.group && item.children.some((c) => c.key === page)) return item.key;
  }
  return null;
}

export default function Sidebar({ page, setPage, open, onClose, user, collapsed }) {
  // Groups open/close on click/tap/keyboard only — no hover-triggered
  // auto-expand (removed per feedback: not appropriate for this app).
  const [expanded, setExpanded] = useState(() => new Set([groupKeyForPage(page)].filter(Boolean)));

  function handleNav(key) {
    setPage(key);
    if (onClose) onClose();
  }

  function toggleGroup(key) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <>
      <div
        className={
          "fixed inset-0 z-[90] bg-[rgba(18,32,26,0.45)] transition-opacity md:hidden " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
        onClick={onClose}
      />
      <div
        className={
          "fixed inset-y-0 left-0 z-[100] flex h-screen w-[248px] flex-shrink-0 flex-col overflow-hidden bg-[var(--green-deep)] text-[#EAF1EC] shadow-[2px_0_24px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out md:sticky md:top-0 md:translate-x-0 md:shadow-none " +
          (open ? "translate-x-0" : "-translate-x-full") + " " +
          (collapsed ? "md:w-0 md:border-0" : "md:w-[248px]")
        }
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <img src="/logo.jpeg" alt="ArthaSetu" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          <div>
            <div className="text-[15px] font-bold leading-tight text-white">ArthaSetu</div>
            <div className="text-[10px] tracking-wider text-[#9DBBAC]">ADMIN CONSOLE</div>
          </div>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto py-3">
          {/* Dashboard: standout home item, separated from the grouped nav below */}
          {(() => {
            const home = NAV.find((i) => i.key === "dashboard");
            const Icon = ICONS[home.icon];
            const isActive = page === home.key;
            return (
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => handleNav(home.key)}
                  className={
                    "flex w-full items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left text-[14px] font-semibold transition-colors " +
                    (isActive
                      ? "border-[var(--brass)]/60 bg-[var(--brass)]/20 text-white"
                      : "border-white/10 bg-white/[0.06] text-[#EAF1EC] hover:bg-white/10")
                  }
                >
                  <Icon size={17} strokeWidth={2.25} className="shrink-0 text-[var(--brass)]" />
                  {home.label}
                </button>
              </div>
            );
          })()}

          <div className="mx-5 mb-2 border-t border-white/10" />

          <div className="flex flex-col gap-1 px-3">
            {NAV.filter((item) => item.key !== "dashboard").map((item) => {
              if (!item.group) {
                const Icon = ICONS[item.icon];
                const isActive = page === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNav(item.key)}
                    className={
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13.5px] transition-colors " +
                      (isActive
                        ? "bg-white/10 font-semibold text-white"
                        : "text-[#D6E5DB] hover:bg-white/5")
                    }
                  >
                    {Icon && <Icon size={16} strokeWidth={2} className="shrink-0 opacity-90" />}
                    {item.label}
                  </button>
                );
              }

              const isOpen = expanded.has(item.key);
              const Icon = ICONS[item.icon];
              const hasActive = item.children.some((c) => c.key === page);
              return (
                <div key={item.key}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.key)}
                    aria-expanded={isOpen}
                    className={
                      "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[11px] font-bold tracking-wider transition-colors " +
                      (hasActive ? "text-white" : "text-[#9DBBAC] hover:text-white")
                    }
                  >
                    {Icon && <Icon size={15} strokeWidth={2.25} className="shrink-0 opacity-80" />}
                    <span className="flex-1">{item.label}</span>
                    <ChevronDown
                      size={14}
                      className={"shrink-0 opacity-70 transition-transform duration-200 " + (isOpen ? "rotate-180" : "")}
                    />
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-200 ease-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      {item.children.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => handleNav(c.key)}
                          className={
                            "flex w-full items-center gap-2.5 rounded-md py-2 pl-9 pr-3 text-left text-[13px] transition-colors " +
                            (page === c.key
                              ? "bg-white/10 font-semibold text-white"
                              : "text-[#D6E5DB] hover:bg-white/5")
                          }
                        >
                          <span
                            className={
                              "h-1 w-1 shrink-0 rounded-full " +
                              (page === c.key ? "bg-[var(--brass)]" : "bg-[#5F8272]")
                            }
                          />
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] text-[#9DBBAC]">
            <ShieldCheck size={14} className="text-[var(--brass)]" />
            <span>Demo environment · NSFDC seed data</span>
          </div>
          <div className="mt-1 text-[10px] tracking-wide text-[#6E8B7C]">ArthaSetu v1.0 · Government of India</div>
        </div>
      </div>
    </>
  );
}
