import { useState } from "react";
import { X } from "lucide-react";

/* ---------------------------------------------------------------
   ConfirmModal — props {title, body, confirmLabel, danger, onConfirm, onClose, children}
   Government-portal brief: destructive/administrative actions (block,
   suspend, publish, resolve) must look deliberately serious — clear
   confirmation with a mandatory reason field when requireReason is set.
   When requireReason is true, onConfirm is called with the reason text.
   --------------------------------------------------------------- */
export default function ConfirmModal({
  title,
  body,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onClose,
  requireReason = false,
  reasonLabel = "Reason for this action",
  children,
}) {
  const [reason, setReason] = useState("");
  const blocked = requireReason && reason.trim().length === 0;

  function handleConfirm() {
    if (blocked) return;
    onConfirm(requireReason ? reason.trim() : undefined);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(18,32,26,0.45)] p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[480px] flex-col rounded-lg bg-[var(--panel)] shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--sage-line)] px-5 py-4">
          <h3 className="text-[15px] font-bold text-[var(--ink)]">{title}</h3>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDEFEC] text-[var(--ink)]"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {body && <p className="mt-0 mb-3 text-[13.5px] leading-relaxed text-[var(--slate)]">{body}</p>}
          {danger && !requireReason && (
            <div className="mb-3 rounded border border-[#E3B7AC] bg-[var(--rust-soft)] px-3 py-2 text-[12.5px] text-[var(--rust)]">
              This is an administrative action and will be recorded in the audit log.
            </div>
          )}
          {requireReason && (
            <div className="mb-1">
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--sage)]">
                {reasonLabel} <span className="text-[var(--rust)]">*</span>
              </label>
              <textarea
                className="min-h-[80px] w-full resize-y rounded border border-[var(--sage-line)] bg-[#FCFCFA] px-3 py-2 text-[13.5px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:bg-white focus:outline-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Required — this note is stored in the audit trail."
              />
              <div className="mt-1 text-[11.5px] text-[var(--slate)]">
                Mandatory for audit-trail compliance.
              </div>
            </div>
          )}
          {children}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--sage-line)] px-5 py-3.5">
          <button
            className="rounded border border-[var(--sage-line)] bg-white px-4 py-2 text-[13px] font-semibold text-[var(--ink)] hover:bg-[#F2F2EF]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={
              "rounded px-4 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 " +
              (danger ? "bg-[var(--rust)] hover:bg-[#6E1A0D]" : "bg-[var(--green-mid)] hover:bg-[var(--green-deep)]")
            }
            onClick={handleConfirm}
            disabled={blocked}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
