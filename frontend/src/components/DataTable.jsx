import { useEffect, useMemo, useState } from "react";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { NA } from "../lib/format.js";
import EmptyState from "./EmptyState.jsx";

/* ---------------------------------------------------------------
   DataTable — generic searchable / sortable / paginated table.
   Same prop contract as the legacy component:
   {columns, rows, pageSize, onRowClick, rowKey, searchFields, extraToolbar, title}
   --------------------------------------------------------------- */
export default function DataTable({
  columns,
  rows,
  pageSize = 10,
  onRowClick,
  rowKey,
  searchFields,
  extraToolbar,
  title,
}) {
  const [q, setQ] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let r = rows;
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      r = r.filter((row) =>
        (searchFields || columns.map((c) => c.key)).some((f) =>
          String(row[f] ?? "").toLowerCase().includes(needle)
        )
      );
    }
    if (sortCol) {
      r = [...r].sort((a, b) => {
        const av = a[sortCol],
          bv = b[sortCol];
        if (av === null || av === undefined) return 1;
        if (bv === null || bv === undefined) return -1;
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortDir;
        return String(av).localeCompare(String(bv)) * sortDir;
      });
    }
    return r;
  }, [rows, q, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [q, rows.length]);

  function toggleSort(key) {
    if (sortCol === key) {
      setSortDir((d) => -d);
    } else {
      setSortCol(key);
      setSortDir(1);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--sage-line)] px-4 py-3">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--slate)]">
            <Search size={14} />
          </span>
          <input
            className="w-full rounded border border-[var(--sage-line)] bg-[#FCFCFA] py-2 pl-9 pr-3 text-[13.5px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:bg-white focus:outline-none"
            placeholder={"Search " + (title || "records") + "…"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {extraToolbar}
        <span className="text-[12.5px] text-[var(--slate)]">
          {filtered.length} of {rows.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-[13.5px]">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => c.sortable !== false && toggleSort(c.key)}
                  className="whitespace-nowrap border-b border-[var(--sage-line)] bg-[#FAFAF7] px-4 py-3 text-left text-[12px] font-semibold tracking-wide text-[var(--slate)]"
                  style={{ cursor: c.sortable !== false ? "pointer" : "default" }}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {sortCol === c.key &&
                      (sortDir === 1 ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState icon={Search} title="No records match your search." />
                </td>
              </tr>
            )}
            {pageRows.map((row) => (
              <tr
                key={row[rowKey]}
                className={
                  "border-b border-[#EFF1EE] " + (onRowClick ? "cursor-pointer hover:bg-[#FBFBF8]" : "")
                }
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-4 py-3 text-[var(--ink)]">
                    {c.render ? c.render(row) : row[c.key] ?? <NA />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--sage-line)] px-4 py-3 text-[12.5px] text-[var(--slate)]">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            className="h-8 w-8 rounded border border-[var(--sage-line)] bg-white text-[12.5px] disabled:opacity-40"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let n = i + 1;
            if (totalPages > 5 && page > 3) n = page - 2 + i;
            if (n < 1 || n > totalPages) return null;
            return (
              <button
                key={n}
                className={
                  "h-8 w-8 rounded border text-[12.5px] " +
                  (n === page
                    ? "border-[var(--green-mid)] bg-[var(--green-mid)] text-white"
                    : "border-[var(--sage-line)] bg-white")
                }
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            );
          })}
          <button
            className="h-8 w-8 rounded border border-[var(--sage-line)] bg-white text-[12.5px] disabled:opacity-40"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
