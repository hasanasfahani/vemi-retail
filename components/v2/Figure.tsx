import { placeholderNote } from "@/lib/v2Content";

/* Marks any number we cannot yet stand behind. A dashed amber underline
   plus an asterisk, so an unverified figure is never mistaken for a
   verified one — especially in the proof strip, which sits immediately
   before the ask. */

export function Figure({
  value,
  placeholder,
  className = "",
}: {
  value: string;
  placeholder?: boolean;
  className?: string;
}) {
  if (!placeholder) return <span className={className}>{value}</span>;
  return (
    <span
      className={className}
      title={placeholderNote}
      style={{
        borderBottom: "1.5px dashed var(--color-warn)",
        paddingBottom: "1px",
      }}
    >
      {value}
      <sup className="ml-0.5 text-[0.55em] font-semibold" style={{ color: "var(--color-warn)" }}>
        *
      </sup>
    </span>
  );
}

export function PlaceholderNote({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-center gap-1.5 text-xs text-ink-400 ${className}`}>
      <span className="font-semibold" style={{ color: "var(--color-warn)" }}>
        *
      </span>
      {placeholderNote}
    </p>
  );
}

export default Figure;
