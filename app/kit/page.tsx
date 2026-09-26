import type { Metadata } from "next";
import KitView from "./KitView";

/* The component sheet: every brand component in every state, for review
   at 375 and 1440. Not linked from anywhere and not indexed. */
export const metadata: Metadata = {
  title: "Component sheet · Vemi",
  robots: { index: false, follow: false },
};

export default function KitPage() {
  return <KitView />;
}
