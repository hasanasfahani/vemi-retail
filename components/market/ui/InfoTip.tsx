"use client";

/* The explanation, one click away.

   Every composite in this portal is a judgement — a weighting, a
   denominator, a par somebody chose — and a figure whose derivation
   cannot be inspected is a figure nobody should act on. The working
   lives behind this button rather than on the face of the card. */

import type { ReactNode } from "react";
import { InfoPopover } from "@/components/vemi/Popover";

export default function InfoTip({
  label = "How this is measured",
  align = "right",
  children,
}: {
  label?: string;
  align?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <InfoPopover label={label} align={align === "right" ? "end" : "start"}>
      {children}
    </InfoPopover>
  );
}
