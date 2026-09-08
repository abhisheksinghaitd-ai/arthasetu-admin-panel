import { useEffect, useState } from "react";
import { api } from "../api.js";
import { GRIEVANCES_FALLBACK } from "../lib/demoData.js";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Chip from "../components/Chip.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

/* ---------------------------------------------------------------
   GrievancesPage — props {user}
   Ported from legacy GrievancesPage (~line 2066). Citizens and
   partners dispute a block or suspension here — the due-process
   redressal trail required of a government system (PDF §5.7/6).
   Resolving a grievance is an administrative action, so per the
   design brief it now goes through a confirmation modal with a
   mandatory reason, instead of resolving on a single click.
   --------------------------------------------------------------- */
export default function GrievancesPage({ user, setAuditLog }) {
  const [rows, setRows] = useState(GRIEVANCES_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [target, setTarget] = useState(null);

  const canResolve = user?.role === "Super Admin" || user?.role === "Compliance / Auditor";

  async function load() {
    setLoading(true);
    try {
      const data = await api.listGrievances();
      setRows(data);
      setOffline(false);
    } catch (err) {
      setOffline(true);
      setRows(GRIEVANCES_FALLBACK);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(ref, reason) {
    try {
      await api.resolveGrievance(ref, reason);
    } catch (err) {
      /* offline demo mode — update locally anyway */
    }
    setRows((rs) =>
      rs.map((g) =>
        g.grievance_ref === ref
          ? { ...g, status: "resolved", resolved_at: new Date().toISOString(), resolution_note: reason }
          : g
      )
    );
    if (setAuditLog) {
      setAuditLog((prev) => [
        {
          time: new Date().toISOString().slice(0, 16).replace("T", " "),
          category: "Grievance",
          event: `Grievance ${ref} marked resolved. Note: ${reason}`,
          by: user?.name || "Unknown",
        },
        ...prev,
      ]);
    }
    setTarget(null);
  }

  const columns = [
    { key: "grievance_ref", label: "ID" },
    {
      key: "raised_by_type",
      label: "RAISED BY",
      render: (r) => (
        <Chip tone="slate">
          {r.raised_by_type} · {r.raised_by_id}
        </Chip>
      ),
    },
    { key: "subject", label: "SUBJECT" },
    {
      key: "status",
      label: "STATUS",
      render: (r) => <Chip tone={r.status === "open" ? "amber" : "green"}>{r.status}</Chip>,
    },
    { key: "created_at", label: "RAISED", render: (r) => String(r.created_at).slice(0, 10) },
    {
      key: "_action",
      label: "",
      sortable: false,
      render: (r) =>
        r.status === "open" && canResolve ? (
          <button
            className="rounded border border-[var(--green-mid)] bg-[var(--green-mid)] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[var(--green-deep)]"
            onClick={(e) => {
              e.stopPropagation();
              setTarget(r);
            }}
          >
            Mark Resolved
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Grievances"
        breadcrumb={["Grievances"]}
        description="Citizens and partners can dispute a block or suspension here — a due-process redressal trail for a government system."
      />
      {offline && (
        <div className="mb-4 rounded border border-[var(--sage-line)] bg-[var(--amber-soft)] px-4 py-3 text-[13.5px] text-[var(--amber)]">
          Backend not reachable — showing local demo grievances.
        </div>
      )}
      {!canResolve && (
        <div className="mb-4 rounded border border-[var(--sage-line)] bg-[var(--green-soft)] px-4 py-3 text-[13.5px] text-[var(--sage)]">
          Your role can view grievances but cannot mark them resolved. Resolution is limited to Super Admin
          and Compliance / Auditor.
        </div>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="grievance_ref"
        title="grievances"
        searchFields={["subject", "raised_by_id", "status"]}
        pageSize={14}
      />

      {target && (
        <ConfirmModal
          title={`Resolve grievance ${target.grievance_ref}`}
          body={`"${target.subject}" — mark this grievance as resolved. This action is recorded in the audit log and cannot be undone from this screen.`}
          confirmLabel="Mark Resolved"
          requireReason
          reasonLabel="Resolution note"
          onConfirm={(reason) => resolve(target.grievance_ref, reason)}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}
