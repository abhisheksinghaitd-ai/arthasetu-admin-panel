import { isValidElement } from "react";

/* ---------------------------------------------------------------
   StatCard — one consistent template for every metric card.
   Props:
     - label: string (e.g. "Total Schemes")
     - value: number | string | ReactNode
     - sub: string | ReactNode (secondary context/breakdown)
     - tone: "default" | "accent" | "warn" | "bad"  — colors the top
       accent bar, the value text, and the badge. The icon box stays
       neutral on every card so tone reads as one deliberate signal
       instead of the icon box also shifting color inconsistently.
     - icon: Lucide icon component or ReactNode
     - badge: string | ReactNode (e.g. "4 Types", "Action Needed")
     - visual: ReactNode (e.g. <MiniDonut/>) — shown instead of icon
     - onClick: optional — when set, the whole card becomes a real
       (keyboard-accessible) button that navigates somewhere
     - className: string
   --------------------------------------------------------------- */

const TONES = {
  default: { bar: "bg-[var(--brass)]", text: "text-[var(--ink)]", badgeBg: "bg-[var(--brass-soft)] text-[#7a5b18]" },
  accent: { bar: "bg-[var(--green-mid)]", text: "text-[var(--green-mid)]", badgeBg: "bg-[var(--green-soft)] text-[var(--green-mid)]" },
  warn: { bar: "bg-[var(--amber)]", text: "text-[var(--amber)]", badgeBg: "bg-[var(--amber-soft)] text-[var(--amber)]" },
  bad: { bar: "bg-[var(--rust)]", text: "text-[var(--rust)]", badgeBg: "bg-[var(--rust-soft)] text-[var(--rust)]" },
};

const ICON_BOX = "bg-[var(--brass-soft)]/70 text-[var(--brass)] border border-[var(--brass)]/20";

export default function StatCard({ label, value, sub, tone = "default", icon: Icon, badge, visual, onClick, className = "" }) {
  const t = TONES[tone] || TONES.default;
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick } : {})}
      className={`relative flex w-full flex-col justify-between overflow-hidden rounded-xl border border-[var(--sage-line)] bg-[var(--panel)] p-4 text-left shadow-[var(--shadow-premium)] ${
        onClick ? "cursor-pointer hover:border-[var(--brass)]/50" : ""
      } ${className}`}
    >
      {/* Top accent bar — the one place tone is signaled visually besides the value/badge */}
      <div className={`absolute left-0 top-0 h-[3px] w-full ${t.bar}`} />

      {/* Top row: Label and Icon / Visual — icon box is always neutral brass */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--slate)] leading-snug">
            {label}
          </span>
        </div>

        {Icon && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ICON_BOX}`}>
            {isValidElement(Icon) ? Icon : <Icon size={16} strokeWidth={2.2} />}
          </div>
        )}

        {!Icon && visual && <div className="shrink-0">{visual}</div>}
      </div>

      {/* Middle row: Big Metric Value & Badge */}
      <div className="relative my-2.5 flex items-baseline gap-2 flex-wrap">
        <div className={`text-[28px] font-bold leading-none tracking-tight ${t.text}`}>{value}</div>
        {badge && (
          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide ${t.badgeBg}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Bottom row: Subtitle / Context info */}
      {sub && <div className="relative mt-auto text-[12px] leading-relaxed text-[var(--slate)]">{sub}</div>}
    </Wrapper>
  );
}
