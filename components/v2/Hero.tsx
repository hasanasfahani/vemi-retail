import Image from "next/image";
import { hero, ids } from "@/lib/v2Content";
import InsightV from "./InsightV";

/* The hero (brand refresh, phase 7): Paper, the tagline at display
   size, one primary action and one secondary, and
   the Insight V key visual. The product follows in a flat white panel
   (border-first: no shadow), shot from the rebranded portal. */
export default function Hero() {
  return (
    <section id={ids.top} className="relative bg-bg pb-16 pt-12 sm:pb-24 sm:pt-16 lg:pt-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0">
            <p className="vm-label">{hero.eyebrow}</p>
            <h1 className="mt-5 text-[clamp(44px,6.4vw,72px)] font-semibold leading-[1.06] tracking-[-0.02em] text-text">
              {hero.headlineLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg text-text-muted">{hero.subhead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={hero.primaryCta.href} data-demo-cta className="vm-btn vm-btn--primary">
                {hero.primaryCta.label}
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </a>
              <a href={hero.secondaryCta.href} className="vm-btn vm-btn--secondary">
                {hero.secondaryCta.label}
              </a>
            </div>
          </div>

          <div className="hidden min-w-0 lg:block">
            <InsightV className="h-auto w-full" />
          </div>
        </div>

        <div className="mt-16 overflow-hidden rounded-xl border border-line bg-surface sm:mt-20">
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            width={2000}
            height={1003}
            preload
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="block h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
