"use client";

import { useEffect, useState } from "react";
import { nav, ids } from "@/lib/v2Content";
import { Logo, LogoDescriptor } from "@/components/vemi/Logo";
import Icon from "@/components/vemi/Icon";

/* The site bar (brand refresh, phase 7): full width, sticky, 72px.
   On Paper at the top so it reads as part of the hero; white with a
   Line hairline once the page moves. No glass, blur or shadow. The
   current section is a Violet 100 pill (scroll-spy), and there is one
   primary action. */

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

  const solid = scrolled || open;

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        solid ? "border-b border-line bg-surface" : "border-b border-transparent bg-bg"
      }`}
    >
      <nav className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6" aria-label="Main">
        <a href={`#${ids.top}`} className="flex items-center rounded-sm" aria-label={`${nav.brand}, back to top`}>
          <span className="hidden xl:inline-flex">
            <LogoDescriptor height={26} title="" />
          </span>
          <span className="inline-flex xl:hidden">
            <Logo height={26} title="" />
          </span>
        </a>

        {/* desktop links */}
        <div className="hidden items-center gap-1 lg:flex">
          {nav.links.map((l) => {
            const on = active === l.href.slice(1);
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={on ? "true" : undefined}
                className={`flex min-h-10 items-center rounded-md px-3 text-[15px] transition-colors ${
                  on
                    ? "bg-primary-tint font-semibold text-primary-text"
                    : "font-medium text-text hover:bg-surface"
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <a href={nav.cta.href} data-demo-cta className="vm-btn vm-btn--primary hidden sm:inline-flex">
            {nav.cta.label}
          </a>

          {/* mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="vm-iconbtn -mr-2 text-text lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </nav>

      {/* mobile sheet: full width under the bar, 48px rows, the action last */}
      {open ? (
        <div id="site-menu" className="border-t border-line bg-surface lg:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col px-4 py-3 sm:px-6">
            {nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center border-b border-line text-base font-medium text-text last:border-0"
              >
                {l.label}
              </a>
            ))}
            <a
              href={nav.cta.href}
              data-demo-cta
              onClick={() => setOpen(false)}
              className="vm-btn vm-btn--primary vm-btn--block mt-3"
            >
              {nav.cta.label}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
