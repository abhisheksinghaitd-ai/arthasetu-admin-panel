import { Inbox } from "lucide-react";

/* ---------------------------------------------------------------
   EmptyState — props {icon, title, description}
   icon accepts a lucide-react component; defaults to Inbox.
   --------------------------------------------------------------- */
export default function EmptyState({ icon: Icon = Inbox, title = "Nothing to show", description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <Icon size={28} strokeWidth={1.5} className="text-[var(--sage-line)]" />
      <div className="text-[15px] font-semibold text-[var(--ink)]">{title}</div>
      {description && <div className="max-w-md text-[13.5px] text-[var(--slate)]">{description}</div>}
    </div>
  );
}
