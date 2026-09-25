"use client";

import { useState, useSyncExternalStore } from "react";
import Modal from "./Modal";
import QuoteForm from "@/components/quote/QuoteForm";
import { readAccessSnapshot } from "@/lib/demoAccess";

/* The strip at the top of every portal page.

   It does two jobs. It states plainly that the figures are illustrative
   — the portal is a working product surface, so without this a visitor
   can reasonably read the numbers as their own market. And it gives
   them somewhere to go the moment the product lands: Request a Quote
   opens the same form as the pricing section on the site, prefilled
   with the details they already gave to open the dashboard. */

const noopSubscribe = () => () => {};

export default function DemoBanner() {
  const [open, setOpen] = useState(false);
  const session = useSyncExternalStore(noopSubscribe, readAccessSnapshot, () => null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-violet-050 px-4 py-2.5 sm:px-6">
        <p className="flex items-start gap-2 text-[12.5px] leading-5 text-ink-700">
          <span
            aria-hidden
            className="mt-[3px] inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: "var(--color-warn)" }}
          />
          <span>
            <span className="font-semibold text-ink-900">Sample data.</span>{" "}
            This dashboard is a demonstration of the Vemi platform — the figures
            are illustrative and are not measurements of your brand.
          </span>
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-primary shrink-0 !px-3.5 !py-1.5 text-[13px]"
        >
          Request a Quote
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} labelledBy="portal-quote-title">
        <h2 id="portal-quote-title" className="sr-only">
          Request a quote
        </h2>
        <QuoteForm
          idPrefix="portal-quote"
          initialContact={{
            fullName: session?.fullName,
            email: session?.email,
            company: session?.company,
          }}
        />
      </Modal>
    </>
  );
}
