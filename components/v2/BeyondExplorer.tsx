"use client";

import Image from "next/image";
import { useState } from "react";
import { beyond } from "@/lib/v2Content";
import Icon from "@/components/v2/Icon";

const pillars = beyond.pillars;
const desktopColumns = [
  "lg:grid-cols-[1.75fr_0.7fr_0.7fr]",
  "lg:grid-cols-[0.7fr_1.75fr_0.7fr]",
  "lg:grid-cols-[0.7fr_0.7fr_1.75fr]",
] as const;

export default function BeyondExplorer() {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div
        className={`grid grid-cols-1 gap-4 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:h-[570px] ${desktopColumns[active]}`}
      >
        {pillars.map((pillar, index) => {
          const on = index === active;
          const panelId = `beyond-panel-${pillar.key}`;

          return (
            <article
              key={pillar.key}
              className={`relative min-w-0 overflow-hidden rounded-3xl border bg-white transition-colors duration-300 motion-reduce:transition-none ${
                on ? "border-violet/30" : "border-line hover:border-line-strong"
              }`}
            >
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-expanded={on}
                aria-controls={panelId}
                className="group relative block h-[270px] w-full overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-inset lg:h-full"
              >
                <Image
                  src={pillar.image.src}
                  alt={pillar.image.alt}
                  fill
                  sizes="(max-width: 1023px) 100vw, 54vw"
                  className={`transform-gpu object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none ${
                    on ? "scale-100" : "scale-[1.01] group-hover:scale-[1.025]"
                  }`}
                  style={{ objectPosition: pillar.image.position }}
                />

                <span
                  aria-hidden
                  className={`absolute inset-0 bg-black/20 transition-opacity duration-300 motion-reduce:transition-none ${on ? "opacity-0" : "opacity-100 group-hover:opacity-0"}`}
                />

                <span
                  className={`absolute bottom-4 left-4 right-4 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur ${on ? "lg:right-[50%]" : ""}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-display text-lg font-bold leading-tight tracking-tight text-ink-900">
                      {pillar.title}
                    </span>
                    <span
                      aria-hidden
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-reduce:transition-none ${
                        on ? "rotate-45 bg-violet text-white" : "bg-white text-ink-700"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-ink-500">{pillar.tagline}</span>
                </span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-label={`${pillar.title} details`}
                aria-hidden={!on}
                className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out motion-reduce:transition-none lg:absolute lg:bottom-5 lg:right-5 lg:top-5 lg:w-[46%] lg:grid-rows-[1fr] ${
                  on
                    ? "grid-rows-[1fr] translate-x-0 opacity-100"
                    : "pointer-events-none grid-rows-[0fr] opacity-0 lg:invisible lg:translate-x-2"
                }`}
              >
                <div className="min-h-0 overflow-hidden border-t border-line bg-white lg:overflow-y-auto lg:rounded-2xl lg:border lg:shadow-[var(--shadow-pop)]">
                  <div className="p-6 lg:p-7">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet text-white">
                      <Icon name={pillar.icon} className="h-5 w-5" />
                    </span>
                    <span className="t-eyebrow mt-6 block">What we track</span>
                    <h3 className="t-h3 mt-2 !text-2xl">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-500">{pillar.body}</p>

                    <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {pillar.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm leading-snug text-ink-700">
                          <span
                            aria-hidden
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: "var(--color-violet)" }}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl bg-ink-900 px-6 py-8 text-white sm:px-8 lg:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[0.68fr_1.32fr]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">Connected intelligence</span>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">{beyond.convergence.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-300">{beyond.convergence.body}</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative flex-1">
              <span aria-hidden className="absolute left-4 right-4 top-1/2 hidden h-px bg-white/20 sm:block" />
              <div className="relative grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap sm:justify-between">
                {beyond.convergence.inputs.map((input) => (
                  <span key={input} className="whitespace-nowrap rounded-full border border-white/25 bg-ink-900 px-3 py-1.5 text-center text-[11px] font-medium text-white">
                    {input}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-white/20 to-violet sm:w-10" />
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--color-violet-100)" }}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M5 12h14M14 7l5 5-5 5" />
              </svg>
              <span className="shrink-0 rounded-xl bg-violet px-5 py-3 text-sm font-bold text-white shadow-[0_8px_30px_rgba(105,70,255,0.3)]">
                {beyond.convergence.output}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
