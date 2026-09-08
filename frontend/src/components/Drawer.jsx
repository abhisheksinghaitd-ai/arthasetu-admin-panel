import { X } from "lucide-react";

/* ---------------------------------------------------------------
   Drawer — generic slide-over detail panel shell.
   props: {title, subtitle, onClose, children}
   Renders nothing when title is falsy (caller pattern: pass the
   selected record's derived title, or null/undefined to hide).
   --------------------------------------------------------------- */
export default function Drawer({ title, subtitle, onClose, children }) {
  if (!title) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(18,32,26,0.4)]" onClick={onClose}>
      <div
        className="h-screen w-full max-w-[560px] overflow-y-auto bg-[var(--paper)] shadow-[-8px_0_30px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between bg-[var(--green-deep)] px-6 py-5 text-white">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">{title}</h2>
            {subtitle && <div className="mt-1 text-[12.5px] text-[#B9D1C3]">{subtitle}</div>}
          </div>
          <button
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
