"use client";

import { useSyncExternalStore } from "react";
import { scope } from "@/lib/portal";
import ScopeBar from "./ScopeBar";
import { readAccessSnapshot } from "@/lib/demoAccess";
import LastSynced from "./LastSynced";

const noopSubscribe = () => () => {};

/* Scope + freshness, always in view. This is the bar that tells a
   visitor what they are looking at and how current it is. */
export default function PortalTopBar() {
  const session = useSyncExternalStore(noopSubscribe, readAccessSnapshot, () => null);
  const initials = session?.fullName
    ? session.fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")
    : null;

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-4 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
      <ScopeBar />

      <div className="flex shrink-0 items-center gap-3">
        <LastSynced />
        <span
          className="hidden h-4 w-px bg-line md:inline-block"
          aria-hidden
        />
        <span className="hidden text-[13px] text-ink-500 sm:inline">
          Data as of{" "}
          <span className="font-semibold text-ink-900">{scope.dataAsOf}</span>
        </span>
        {initials && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{
              background: "var(--color-violet-050)",
              color: "var(--color-violet-ink)",
            }}
            title={session?.company ?? undefined}
          >
            {initials}
          </span>
        )}
      </div>
    </header>
  );
}
