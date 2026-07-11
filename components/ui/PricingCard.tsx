import { packages } from "@/lib/content";

type Tier = (typeof packages.tiers)[number];

export default function PricingCard({ tier }: { tier: Tier }) {
  const featured = tier.featured;
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-7 ${
        featured
          ? "border-violet bg-white shadow-[var(--shadow-pop)]"
          : "border-line bg-white"
      }`}
    >
      {featured && "ribbon" in tier && tier.ribbon && (
        <span className="absolute -top-2.5 left-7 rounded-md bg-violet px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {tier.ribbon}
        </span>
      )}

      <h3 className="t-h3">{tier.name}</h3>
      <p className="mt-1 text-sm text-ink-500">{tier.audience}</p>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="tnum text-4xl">{tier.price}</span>
        {tier.priceSuffix && (
          <span className="text-sm text-ink-400">{tier.priceSuffix}</span>
        )}
      </div>
      {tier.priceNote && (
        <span className="text-xs text-ink-400">{tier.priceNote}</span>
      )}

      <a
        href={tier.cta.href}
        className={`mt-6 ${featured ? "btn-primary" : "btn-secondary"} w-full`}
      >
        {tier.cta.label}
      </a>

      <ul className="mt-7 space-y-2.5">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-2.5 text-sm text-ink-700">
            <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="var(--color-violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 10.5 8 14.5 16 6" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      {tier.limits && (
        <p className="mt-6 rounded-lg bg-canvas p-3 text-xs text-ink-500">
          <span className="font-semibold text-ink-700">Limits: </span>
          {tier.limits}
        </p>
      )}
      {tier.bonus && (
        <p className="mt-3 rounded-lg border border-violet-100 bg-violet-050 p-3 text-xs font-medium text-violet-ink">
          {tier.bonus}
        </p>
      )}
    </div>
  );
}
