import { finalCta, placeholders } from "@/lib/content";
import Reveal from "@/components/ui/Reveal";

export default function FinalCta() {
  return (
    <section id="final-cta" className="section">
      <div className="container-vemi">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-line bg-canvas px-8 py-16 text-center sm:px-16 sm:py-20">
            <h2 className="t-h2 mx-auto max-w-2xl">{finalCta.headline}</h2>
            <p className="t-lead mx-auto mt-5 max-w-xl">{finalCta.subhead}</p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={finalCta.primaryCta.href} className="btn-primary">
                {finalCta.primaryCta.label}
              </a>
              <a href="#packages" className="btn-secondary">
                View packages
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {finalCta.secondaryLinks.map((l) => (
                <a
                  key={l}
                  href={finalCta.primaryCta.href}
                  className="text-sm font-medium text-ink-500 underline-offset-4 hover:text-ink-900 hover:underline"
                >
                  {l}
                </a>
              ))}
            </div>

            {/* trust badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-8">
              {finalCta.badges.map((b) => (
                <span key={b} className="chip">
                  <span className="dot" style={{ background: "var(--color-violet)" }} />
                  {b}
                </span>
              ))}
            </div>

            {/* contact */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-500">
              <a href={`mailto:${placeholders.email}`} className="font-medium hover:text-ink-900">
                {placeholders.email}
              </a>
              <span aria-hidden className="text-line-strong">|</span>
              <span className="font-medium">{placeholders.phone}</span>
              <span aria-hidden className="text-line-strong">|</span>
              <a href={placeholders.linkedin} className="font-medium hover:text-ink-900">
                LinkedIn
              </a>
            </div>
            <p className="mt-4 text-xs text-ink-400">{finalCta.trust}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
