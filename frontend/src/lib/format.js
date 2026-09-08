/* ============================================================
   Formatting + status/chip helpers — ported verbatim (in behavior)
   from src/_legacy_reference_DO_NOT_EDIT.jsx.

   This file is plain .js (not .jsx), so the chip helpers use
   React.createElement instead of JSX syntax — same markup/classes,
   just without a JSX transform dependency.
   ============================================================ */
import { createElement } from "react";
import Chip from "../components/Chip.jsx";

export function fmtNum(v, digits = 2) {
  if (v === null || v === undefined || v === "" || Number.isNaN(v)) return null;
  return Number(v).toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function fmtINR(v) {
  if (v === null || v === undefined || v === "") return null;
  return "₹" + Number(v).toLocaleString("en-IN");
}

export function fmtLakh(v) {
  if (v === null || v === undefined || v === "" || Number.isNaN(v)) return null;
  return "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " L";
}

export function fmtPct(v, digits = 1) {
  if (v === null || v === undefined || v === "" || Number.isNaN(v)) return null;
  return Number(v).toFixed(digits) + "%";
}

// Renders "Not Available" (or a custom label) in the amber "missing data" style.
export function NA({ label } = {}) {
  return createElement(
    "span",
    { className: "inline-flex items-center gap-1 text-[13px] italic font-semibold text-[var(--amber)]" },
    (label || "Not Available")
  );
}

/* ---------- Effective admin status resolution ----------
   admin_status_override (set via UI) takes precedence for display + routing exclusion.
   Otherwise falls back to source active_status (UNKNOWN for all rows currently). */
export function effectiveStatus(p) {
  return p.admin_status_override || (p.active_status === "UNKNOWN" ? "ACTIVE" : p.active_status);
}

export function statusChip(status) {
  const map = {
    ACTIVE: "green",
    INACTIVE: "slate",
    BLOCKED: "rust",
    "UNDER REVIEW": "amber",
    UNKNOWN: "amber",
  };
  return createElement(Chip, { tone: map[status] || "slate" }, status);
}

export function locationChip(p) {
  if (p.has_location) return createElement(Chip, { tone: "green" }, "VERIFIED");
  return createElement(Chip, { tone: "amber" }, "MISSING");
}

export function dqChip(flag) {
  if (flag === "OK") return createElement(Chip, { tone: "green" }, "VALID");
  if (flag === "SOURCE_ZERO_UTILIZATION_WITH_PENDING") return createElement(Chip, { tone: "amber" }, "WARNING");
  return createElement(Chip, { tone: "slate" }, flag || "UNKNOWN");
}
