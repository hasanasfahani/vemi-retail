import Hero from "@/components/v2/Hero";
import VisibilityGap from "@/components/v2/VisibilityGap";
import RetailAudit from "@/components/v2/RetailAudit";
import InsightToAction from "@/components/v2/InsightToAction";
import Trust from "@/components/v2/Trust";
import Beyond from "@/components/v2/Beyond";
import ProofStrip from "@/components/v2/ProofStrip";
import RequestSection from "@/components/v2/RequestSection";

/* Eight sections. Every one answers a buyer question: why do I need
   this, what will I know, what can I do with it, can I trust it, what
   else can Vemi help me understand, and how do I start.

   Removed as standalone sections: the platform tour, the process
   diagram, the coverage essay, and the role list — they described Vemi
   without giving a buyer a reason to care. */

export default function V2Page() {
  return (
    <>
      <Hero />            {/* 1 — explain instantly + product proof  */}
      <VisibilityGap />   {/* 2 — urgency                            */}
      <RetailAudit />     {/* 3 — what we measure                    */}
      <InsightToAction /> {/* 4 — what you'll DO (closes on measure) */}
      <Trust />           {/* 5 — can I trust it                     */}
      <Beyond />          {/* 6 — connected market intelligence     */}
      <ProofStrip />      {/* 7 — credibility before the ask         */}
      <RequestSection />  {/* 8 — convert                            */}
    </>
  );
}
