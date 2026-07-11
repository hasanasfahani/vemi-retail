/* A weighted closing CTA for a section — a violet-tinted accent band with a
   display-type line and a primary action. One reusable moment, used sparingly. */

type Props = {
  eyebrow?: string;
  title: string;
  sub?: string;
  buttonLabel: string;
  href: string;
  secondary?: { label: string; href: string };
};

export default function CtaBand({ eyebrow, title, sub, buttonLabel, href, secondary }: Props) {
  return (
    <div
      className="rounded-2xl border px-6 py-7 sm:px-9 sm:py-8"
      style={{ background: "var(--color-violet-050)", borderColor: "var(--color-violet-100)" }}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-violet-ink)" }}>
              {eyebrow}
            </span>
          )}
          <p className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">
            {title}
          </p>
          {sub && <p className="mt-2 text-sm text-ink-500">{sub}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center">
          <a href={href} className="btn-primary">
            {buttonLabel}
            <span aria-hidden>→</span>
          </a>
          {secondary && (
            <a href={secondary.href} className="btn-ghost">
              {secondary.label}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
