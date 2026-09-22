"use client";

import { useState } from "react";
import { beyond } from "@/lib/v2Content";
import Icon from "@/components/v2/Icon";

/* §10–13 in one area. The three cards are also the tabs, so the
   "compact cards" brief and the three pillars' detail share a screen —
   the expansion story stays at ~25% of the page and never outweighs
   the retail audit that Vemi actually sells today. */

const pillars = beyond.pillars;

export default function BeyondExplorer() {
  const [active, setActive] = useState(0);
  const current = pillars[active];

  return (
    <div>
      {/* the three cards / tabs */}
      <div className="grid gap-4 md:grid-cols-3">
        {pillars.map((p, i) => {
          const on = i === active;
          return (
            <button
              key={p.key}
              onClick={() => setActive(i)}
              aria-pressed={on}
              className={`rounded-2xl border p-5 text-left transition-colors ${
                on
                  ? "border-violet bg-violet-050"
                  : "border-line bg-white hover:border-line-strong"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  on ? "bg-violet text-white" : "border border-line text-ink-900"
                }`}
              >
                <Icon name={p.icon} className="h-[18px] w-[18px]" />
              </span>
              <h3 className={`t-h3 mt-3 !text-base ${on ? "!text-violet-ink" : ""}`}>{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{p.tagline}</p>
            </button>
          );
        })}
      </div>

      {/* the selected pillar's detail */}
      <div key={active} className="panel-in mt-4 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <span className="t-eyebrow">What we track</span>
            <h4 className="t-h3 mt-2 !text-xl">{current.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{current.body}</p>
          </div>

          <ul className="grid flex-1 gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:max-w-xl">
            {current.items.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-ink-700">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--color-violet)" }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
