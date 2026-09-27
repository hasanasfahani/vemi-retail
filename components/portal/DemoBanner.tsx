"use client";

import { useState, useSyncExternalStore } from "react";
import Modal from "./Modal";
import QuoteForm from "@/components/quote/QuoteForm";
import { readAccessSnapshot } from "@/lib/demoAccess";
import { ConfidenceBadge } from "@/components/vemi/ConfidenceBadge";
import { Button } from "@/components/vemi/Button";

/* The strip at the top of every portal page.

   It does two jobs. It states plainly that the figures are illustrative
   (the brand kit's own rule: "Label demo data 'Sample data'") — without
   it a visitor can reasonably read the numbers as their own market. And
   it gives them somewhere to go: Request a quote opens the same form as
   the pricing section on the site, prefilled with what they already
   gave. The button is secondary, so each page keeps its one primary for
   its own action. */

const noopSubscribe = () => () => {};

export default function DemoBanner() {
  const [open, setOpen] = useState(false);
  const session = useSyncExternalStore(noopSubscribe, readAccessSnapshot, () => null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-bg px-4 py-2.5 sm:px-6 print:hidden">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text">
          <ConfidenceBadge level="estimated" size="sm">Sample data</ConfidenceBadge>
          <span>The figures are illustrative and are not measurements of your brand.</span>
        </p>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Request a quote
        </Button>
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
            dialCode: session?.dialCode,
            phone: session?.phone,
          }}
          initialIndustry={session?.industry}
        />
      </Modal>
    </>
  );
}
