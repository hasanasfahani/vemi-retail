import { Suspense } from "react";
import { PageHeader } from "@/components/vemi/PageHeader";
import MobileNav from "@/components/market/MobileNav";
import { LockedRegion } from "@/components/vemi/LockedRegion";
import { contract } from "@/lib/market";

/* Consumers is announced in the rail and not built yet. The rail shows
   it padlocked and does not link here, but a hand-typed URL lands on a
   plain statement of what is coming rather than a 404 or a silent
   redirect to a different page. */
export const metadata = { title: "Consumers" };

export default function Page() {
  return (
    <>
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
        <p className="truncate text-lg font-semibold leading-7 text-ink-900">Consumers</p>
        <span className="hidden truncate font-mono text-xs font-medium uppercase tracking-[0.1em] text-ink-500 md:inline">
          {contract.clientShort} · {contract.brand} · {contract.country}
        </span>
      </div>
    </header>
    <main className="mx-auto w-full min-w-0 max-w-[1360px] flex-1 px-4 pb-16 pt-8 sm:px-6">
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={`${contract.country} · ${contract.category} · Consumers`}
          title="Consumer and shopper insight is in development."
          description="What shoppers in Iraq buy, why they switch and what they expect, measured alongside the shelf."
        />
        <div className="max-w-[720px]">
          <LockedRegion
            label="In development"
            title="Consumers"
            lead="Surveys and shopper research joined to the audit, so a shelf gap can be read against what the shopper actually wanted."
          />
        </div>
      </div>
    </main>
    </>
  );
}
