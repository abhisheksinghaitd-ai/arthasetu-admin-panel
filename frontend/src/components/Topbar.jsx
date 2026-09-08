import { useState } from "react";
import { Menu, Bell, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NOTIFICATIONS, PAGE_META } from "../lib/demoData.js";

/* ---------------------------------------------------------------
   Topbar — props {user, page, onLogout, notifCount, onMenuClick,
   sidebarCollapsed, onToggleSidebar}
   Global chrome only (menu toggle, date, notifications, profile).
   Page title/breadcrumb live in each page's <PageHeader/> instead —
   showing them here too used to render the same text twice in a row
   (e.g. "Dashboard" / "Dashboard") for every single-level page.
   --------------------------------------------------------------- */
export default function Topbar({ user, page, onLogout, notifCount, onMenuClick, sidebarCollapsed, onToggleSidebar }) {
  const meta = PAGE_META[page] || { title: "", crumbs: [] };
  const [now] = useState(new Date());
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const [showNotif, setShowNotif] = useState(false);
  const initials = user?.name
    ? user.name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  return (
    <div className="sticky top-0 z-20 flex min-h-[64px] flex-wrap items-center justify-between gap-y-2 border-b border-[var(--sage-line)] bg-[var(--panel)] px-4 py-2 md:px-6">
      <div className="flex items-center gap-2">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded text-[var(--ink)] md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <button
          className="hidden h-9 w-9 items-center justify-center rounded border border-[var(--sage-line)] bg-white text-[var(--slate)] md:inline-flex"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
        <div className="text-[13.5px] font-semibold text-[var(--ink)] md:text-[14px]">{meta.title}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-[12px] text-[var(--slate)] lg:block">{dateStr}</div>

        <div className="relative">
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--sage-line)] bg-white text-[14px] text-[var(--sage)]"
            onClick={() => setShowNotif((s) => !s)}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {notifCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-[var(--rust)] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
                {notifCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-11 z-30 w-[300px] max-w-[85vw] overflow-hidden rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
              <div className="border-b border-[var(--sage-line)] px-4 py-3">
                <h3 className="text-[13.5px] font-bold text-[var(--ink)]">Notifications</h3>
              </div>
              <div className="max-h-[260px] overflow-y-auto">
                {NOTIFICATIONS.map((n, i) => (
                  <div key={i} className="border-b border-[#EFF1EE] px-4 py-3 text-[12.5px] last:border-b-0">
                    <div className="mb-0.5 font-semibold text-[var(--ink)]">{n.title}</div>
                    <div className="text-[var(--slate)]">{n.body}</div>
                    <div className="mt-1 text-[11px] text-[var(--slate)]">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[var(--sage-line)] bg-white py-1 pl-1 pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--green-soft)] text-[11.5px] font-bold text-[var(--green-deep)]">
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="max-w-[120px] truncate text-[12.5px] font-semibold text-[var(--ink)]">{user?.name}</div>
            <div className="max-w-[120px] truncate text-[10.5px] text-[var(--slate)]">{user?.role}</div>
          </div>
        </div>
        <button className="text-[12px] font-semibold text-[var(--rust)]" onClick={onLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}
