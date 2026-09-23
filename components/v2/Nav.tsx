"use client";

import { useEffect, useState } from "react";
import { nav, ids } from "@/lib/v2Content";

/* Sticky marketing nav with scroll-spy. The active link is whichever
   tracked section has most recently passed under the header. */

const TRACKED = nav.links.map((l) => l.href.slice(1));
const OFFSET = 120;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);

      let current: string | null = null;
      for (const id of TRACKED) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= OFFSET) current = id;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet whenever the viewport grows past the breakpoint.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const close = () => setOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav
        className={`mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 rounded-full border border-white/70 bg-white/95 px-5 backdrop-blur-xl transition-shadow duration-300 sm:px-6 ${
          scrolled || open
            ? "shadow-[0_16px_42px_-22px_rgba(20,21,26,0.34)]"
            : "shadow-[0_12px_36px_-24px_rgba(20,21,26,0.28)]"
        }`}
      >
        <a
          href={`#${ids.top}`}
          className="font-display text-xl font-bold tracking-tight text-ink-900"
        >
          {nav.brand}
          <span style={{ color: "var(--color-violet)" }}>.</span>
        </a>

        {/* desktop links */}
        <div className="hidden items-center gap-7 lg:flex">
          {nav.links.map((l) => {
            const on = active === l.href.slice(1);
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={on ? "true" : undefined}
                className={`text-sm font-medium transition-colors ${
                  on ? "text-ink-900" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={nav.cta.href}
            data-demo-cta
            className="btn-primary !px-4 !py-2 text-sm"
          >
            {nav.cta.label}
          </a>

          {/* mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-700 lg:hidden"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* mobile sheet */}
      {open ? (
        <div className="mx-auto mt-2 max-w-[1240px] rounded-[22px] border border-line bg-white/95 p-3 shadow-[0_18px_44px_-24px_rgba(20,21,26,0.38)] backdrop-blur-xl lg:hidden">
          <div className="flex flex-col">
            {nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-ink-700 hover:bg-canvas"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
