import { hero } from "@/lib/content";
import ProductDashboard from "@/components/ui/ProductDashboard";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 md:pt-36">
      <div className="container-vemi">
        {/* headline band */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="chip mx-auto">
            <span className="dot bg-good" style={{ background: "var(--color-good)" }} />
            {hero.eyebrow}
          </span>

          <h1 className="t-display mt-6">
            {hero.headlineLines.map((line, i) => (
              <span key={line} className="block">
                {i === hero.headlineLines.length - 1 ? (
                  <span style={{ color: "var(--color-violet-ink)" }}>{line}</span>
                ) : (
                  line
                )}
              </span>
            ))}
          </h1>

          <p className="t-lead mx-auto mt-5 max-w-xl">{hero.subhead}</p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={hero.primaryCta.href} className="btn-primary w-full sm:w-auto">
              {hero.primaryCta.label}
            </a>
            <a href={hero.secondaryCta.href} className="btn-secondary w-full sm:w-auto">
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>

        {/* product surface — the centerpiece */}
        <div className="relative mx-auto mt-14 max-w-5xl">
          <ProductDashboard />
        </div>

        {/* trust row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {hero.trustRow.map((t) => (
            <span key={t} className="text-sm font-medium text-ink-500">
              <span className="tnum mr-1.5 !text-base text-ink-900">{t.split(" ")[0]}</span>
              {t.split(" ").slice(1).join(" ")}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
