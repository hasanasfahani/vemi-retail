"use client";

import DemoBanner from "./DemoBanner";

/* Top-of-portal chrome. Key redemption lives in PortalGate, which has
   to resolve it before deciding whether to let anyone in. */
export default function PortalChrome() {
  return <DemoBanner />;
}
