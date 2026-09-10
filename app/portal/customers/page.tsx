import { redirect } from "next/navigation";

/* Customers is announced in the rail and not built. The rail shows it
   padlocked and does not link to it, so nobody should arrive here — but
   a hand-typed URL should land somewhere real rather than on a 404 that
   makes the portal look broken. */
export default function Page() {
  redirect("/portal/insights");
}
