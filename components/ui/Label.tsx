export default function Label({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="h-px w-6"
        style={{ background: "var(--color-violet)" }}
      />
      <span className="t-eyebrow">{children}</span>
    </span>
  );
}
