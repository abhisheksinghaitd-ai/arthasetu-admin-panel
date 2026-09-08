/* ---------------------------------------------------------------
   Chip — status / role pill.
   Government-portal brief: legible pills with real padding, not
   tiny badges. tone: green | amber | rust | slate | brass
   --------------------------------------------------------------- */
const TONES = {
  green: "bg-[var(--green-soft)] text-[var(--green-deep)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
  rust: "bg-[var(--rust-soft)] text-[var(--rust)]",
  slate: "bg-[#EDEFEC] text-[var(--slate)]",
  brass: "bg-[var(--brass-soft)] text-[var(--brass)]",
};

export default function Chip({ tone = "slate", children, className = "" }) {
  const toneClass = TONES[tone] || TONES.slate;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold leading-tight whitespace-nowrap ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}
