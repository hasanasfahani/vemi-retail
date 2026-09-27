"use client";

import Image from "next/image";
import { useState } from "react";
import { beyond } from "@/lib/v2Content";
import Icon from "@/components/vemi/Icon";

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
        className={`grid grid-cols-1 gap-6 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:h-[570px] ${desktopColumns[active]}`}
      >
        {pillars.map((pillar, index) => {
          const on = index === active;
          const panelId = `beyond-panel-${pillar.key}`;

          return (
            <article
              key={pillar.key}
              className={`relative min-w-0 overflow-hidden rounded-lg border bg-ink-800 transition-colors duration-300 motion-reduce:transition-none ${
                on ? "border-primary" : "border-transparent hover:border-line-strong"
              }`}
            >
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-expanded={on}
                aria-controls={panelId}
                className="group relative block h-[270px] w-full overflow-hidden text-left lg:h-full"
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
                  className={`absolute bottom-4 left-4 right-4 rounded-md bg-surface p-4 ${on ? "lg:right-[50%]" : ""}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold leading-6 text-ink-900">
                      {pillar.title}
                    </span>
                    <span
                      aria-hidden
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-reduce:transition-none ${
                        on ? "rotate-45 bg-primary text-primary-fg" : "bg-ink-800 text-ink-900"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </span>
                  <span className="mt-1.5 block text-sm text-ink-500">{pillar.tagline}</span>
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
                <div className="min-h-0 overflow-hidden border-t border-line bg-surface lg:overflow-y-auto lg:rounded-md lg:border">
                  <div className="p-6 lg:p-7">
                    <span className="text-primary">
                      <Icon name={pillar.icon} size={24} />
                    </span>
                    <span className="vm-label mt-6 block">What we track</span>
                    <h3 className="mt-2 text-[28px] font-semibold leading-9 text-ink-900">{pillar.title}</h3>
                    <p className="mt-3 text-base text-ink-500">{pillar.body}</p>

                    <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {pillar.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-ink-900">
                          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
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

      {/* the convergence: four inputs, one view */}
      <div className="mt-6 rounded-lg border border-line px-6 py-8 sm:px-8 lg:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[0.68fr_1.32fr]">
          <div>
            <span className="vm-label">Connected intelligence</span>
            <h3 className="mt-2 text-[28px] font-semibold leading-9 text-ink-900">{beyond.convergence.title}</h3>
            <p className="mt-2 max-w-md text-base text-ink-500">{beyond.convergence.body}</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative flex-1">
              <span aria-hidden className="absolute left-4 right-4 top-1/2 hidden h-px bg-line sm:block" />
              <div className="relative grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap sm:justify-between">
                {beyond.convergence.inputs.map((input) => (
                  <span key={input} className="whitespace-nowrap rounded-full border border-line-strong bg-surface px-3 py-1.5 text-center text-sm font-medium text-ink-900">
                    {input}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <span aria-hidden className="h-px w-8 bg-primary sm:w-10" />
              <span className="text-primary">
                <Icon name="arrow-right" size={16} />
              </span>
              <span className="shrink-0 rounded-md bg-primary px-5 py-3 text-[15px] font-semibold text-primary-fg">
                {beyond.convergence.output}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
