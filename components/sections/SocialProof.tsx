import { socialProof } from "@/lib/content";
import Reveal from "@/components/ui/Reveal";

export default function SocialProof() {
  return (
    <section className="section-tight border-y border-line">
      <div className="container-vemi">
        <Reveal>
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <p className="max-w-sm text-sm leading-relaxed text-ink-500">
              {socialProof.statLine}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {Array.from({ length: socialProof.logoCount }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-11 w-28 items-center justify-center rounded-lg border border-dashed border-line text-[11px] font-medium uppercase tracking-wider text-ink-400"
                  aria-label="Client logo placeholder"
                >
                  Logo
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
