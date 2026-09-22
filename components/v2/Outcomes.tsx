import { outcomes, whoUses, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";

/* §14 Why Vemi, with §15 Who Uses Vemi riding underneath as a thin
   band — the two answer the same question ("is this for me?") and read
   better together than as two full sections. */

export default function Outcomes() {
  return (
    <>
      <section id={ids.whyVemi} className="section">
        <div className="container-vemi">
          <Reveal>
            <div className="max-w-2xl">
              <span className="t-eyebrow">{outcomes.eyebrow}</span>
              <h2 className="t-h2 mt-3">{outcomes.headline}</h2>
              <p className="t-lead mt-5">{outcomes.subhead}</p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {outcomes.items.map((o, i) => (
              <Reveal key={o.title} delay={(i % 3) * 0.06}>
                <div className="h-full bg-white p-6">
                  <span className="tnum !text-xs text-ink-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="t-h3 mt-2 !text-base">{o.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{o.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* §15 — who this is for */}
      <section id={ids.who} className="border-y border-line bg-canvas">
        <div className="container-vemi py-10">
          <Reveal>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <span className="t-eyebrow shrink-0">{whoUses.eyebrow}</span>
              <div className="flex flex-wrap items-center gap-2">
                {whoUses.roles.map((r) => (
                  <span key={r} className="chip">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
