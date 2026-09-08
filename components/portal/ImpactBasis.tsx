"use client";

/* The caveat that travels with the money.

   Every IQD figure in this product is measured shelf price multiplied
   by an ASSUMED rate of sale (see lib/economics.ts). A modelled
   currency figure presented without its model is the single fastest
   way to lose a buyer who checks — so the assumption is not a
   tooltip, not a footnote in a spec, but a line on the page next to
   the number it qualifies.

   Collapsed by default because the reader who trusts it should not
   have to scroll past a paragraph, and expandable because the reader
   who doesn't must be able to see the whole derivation without leaving
   the page. It renders nothing at all while the portal is still
   counting facing-days. */

import { useState } from "react";
import { impactAssumption, impactAssumptionShort } from "@/lib/economics";

export default function ImpactBasis({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  if (!impactAssumption || !impactAssumptionShort) return null;

  return (
    <div className={`text-[12px] leading-snug text-ink-500 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-start gap-1.5 text-left hover:text-ink-900"
      >
        <span
          className="mt-[5px] inline-block h-[7px] w-[7px] shrink-0 rounded-full"
          style={{ background: "var(--color-warn)" }}
          aria-hidden
        />
        <span>
          {impactAssumptionShort}{" "}
          <span className="whitespace-nowrap font-semibold underline decoration-dotted underline-offset-2">
            {open ? "Hide basis" : "How this is calculated"}
          </span>
        </span>
      </button>

      {open && (
        <p className="mt-2 max-w-[68ch] rounded-lg bg-canvas px-3 py-2.5 text-[12px] text-ink-700">
          {impactAssumption}
        </p>
      )}
    </div>
  );
}
