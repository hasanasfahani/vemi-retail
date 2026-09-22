import { hero, ids } from "@/lib/v2Content";
import { Figure } from "@/components/v2/Figure";

/* Typographic by design. The product surface is §4 — opening with a
   dashboard would spend that reveal early. Proof metrics ride inline
   here (short set); the fuller credibility strip is §8. */

export default function Hero() {
  return (
    <section id={ids.top} className="relative pt-36 pb-16 md:pt-44 md:pb-20">
      <div className="container-vemi">
        <div className="mx-auto max-w-4xl text-center">
          <span className="chip mx-auto">
            <span className="dot" style={{ background: "var(--color-violet)" }} />
            {hero.eyebrow}
          </span>

          <h1 className="t-display mt-7">
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

          <p className="t-lead mx-auto mt-6 max-w-2xl">{hero.subhead}</p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={hero.primaryCta.href} className="btn-primary w-full sm:w-auto">
              {hero.primaryCta.label}
            </a>
            <a href={hero.secondaryCta.href} className="btn-secondary w-full sm:w-auto">
              {hero.secondaryCta.label}
            </a>
          </div>

          {/* inline proof metrics */}
          <ul className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-y-4">
            {hero.metrics.map((m, i) => (
              <li
                key={m.label}
                className={`px-6 ${i > 0 ? "sm:border-l sm:border-line" : ""}`}
              >
                <div className="tnum !text-xl text-ink-900">
                  <Figure value={m.value} placeholder={m.placeholder} />
                </div>
                <div className="mt-0.5 text-xs text-ink-500">{m.label}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
