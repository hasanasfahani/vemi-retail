import { hero, ids } from "@/lib/v2Content";

/* Deliberately typographic. The product surface is §6 — opening with a
   second dashboard would spend that reveal early and make the page feel
   repetitive. A calm statement + the proof bar beneath does more work. */

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
        </div>
      </div>
    </section>
  );
}
