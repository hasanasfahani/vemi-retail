"use client";

/* Route-change loading state.

   Keyed on the pathname, so every navigation remounts and replays the
   animation. The skeleton and the reveal are pure CSS — no timers, no
   artificial delay on the server — so the page is genuinely as fast as
   it was; the beat just gives the eye something to land on instead of
   a hard content swap. When the audit database is live behind a real
   fetch, this is the component that already holds its place. */

import { usePathname } from "next/navigation";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="portal-page">
      <div className="portal-skeleton" aria-hidden>
        <div className="sk-line sk-title" />
        <div className="sk-line sk-lead" />
        <div className="sk-kpis">
          <div className="sk-block" />
          <div className="sk-block" />
          <div className="sk-block" />
          <div className="sk-block" />
        </div>
        <div className="sk-panel" />
      </div>

      <div className="portal-content">{children}</div>
    </div>
  );
}
