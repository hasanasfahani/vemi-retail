import { coverage } from "@/lib/content";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import IraqMap from "@/components/ui/IraqMap";

const maxPos = Math.max(...coverage.cities.map((c) => c.pos));

export default function Coverage() {
  return (
    <section id="coverage" className="section bg-canvas">
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <Label>{coverage.label}</Label>
            <h2 className="t-h2 mt-4">{coverage.headline}</h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          {/* Iraq map */}
          <Reveal>
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="t-h3 !text-base">On the ground in Iraq</h3>
                <span className="tnum !text-sm" style={{ color: "var(--color-violet-ink)" }}>
                  8 cities
                </span>
              </div>
              <IraqMap />
            </div>
          </Reveal>

          {/* City coverage table */}
          <Reveal delay={0.08}>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-400">
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Points of sale</th>
                    <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Hyper</th>
                    <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Super</th>
                    <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Trad</th>
                    <th className="px-4 py-3 text-right font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {coverage.cities.map((c) => (
                    <tr key={c.name} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(c.pos / maxPos) * 100}%`,
                                background: "var(--color-violet)",
                              }}
                            />
                          </div>
                          <span className="tnum !text-sm text-ink-900">{c.pos}</span>
                        </div>
                      </td>
                      <td className="mono hidden px-4 py-3 text-right text-ink-500 sm:table-cell">{c.hyper}</td>
                      <td className="mono hidden px-4 py-3 text-right text-ink-500 sm:table-cell">{c.super}</td>
                      <td className="mono hidden px-4 py-3 text-right text-ink-500 sm:table-cell">{c.trad}</td>
                      <td className="px-4 py-3 text-right text-xs text-ink-400">{c.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

        </div>

        {/* Channel mix — full width */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {coverage.channels.map((c, i) => (
            <Reveal key={c.channel} delay={i * 0.06}>
              <div className="h-full rounded-xl border border-line bg-white p-5">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-ink-900">{c.channel}</span>
                  <span className="tnum !text-xl" style={{ color: "var(--color-violet-ink)" }}>
                    {c.pct}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full" style={{ width: c.pct, background: "var(--color-violet)" }} />
                </div>
                <p className="mt-2 text-xs text-ink-500">
                  {c.desc} · {c.pos} POS
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Methodology */}
        <div className="mt-16">
          <Reveal>
            <h3 className="t-h3 !text-base text-ink-400">From field to dashboard</h3>
          </Reveal>
          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
            {coverage.timeline.map((t, i) => (
              <Reveal key={t.step} delay={i * 0.06}>
                <div className="h-full bg-white p-5">
                  <span className="tnum !text-sm" style={{ color: "var(--color-violet-ink)" }}>
                    0{i + 1}
                  </span>
                  <h4 className="t-h3 mt-2 !text-base">{t.step}</h4>
                  <span className="text-xs font-medium text-ink-400">{t.when}</span>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
