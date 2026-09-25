"use client";

import DemoBanner from "./DemoBanner";
import { useClaimAdminFromUrl } from "./useRole";

/* Top-of-portal chrome: redeems an admin link if one was used, and
   renders the sample-data notice with the quote CTA. */
export default function PortalChrome() {
  useClaimAdminFromUrl();
  return <DemoBanner />;
}
