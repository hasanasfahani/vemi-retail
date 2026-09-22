import Hero from "@/components/v2/Hero";
import VisibilityGap from "@/components/v2/VisibilityGap";
import RetailAudit from "@/components/v2/RetailAudit";
import Decisions from "@/components/v2/Decisions";
import InsightToAction from "@/components/v2/InsightToAction";
import Trust from "@/components/v2/Trust";
import Beyond from "@/components/v2/Beyond";
import ProofStrip from "@/components/v2/ProofStrip";
import RequestSection from "@/components/v2/RequestSection";

/* Nine sections. Every one answers a buyer question: why do I need
   this, what will I know, what can I do with it, can I trust it, what
   else can Vemi help me understand, and how do I start.

   Removed as standalone sections: the platform tour, the process
   diagram, the coverage essay, and the role list — they described Vemi
   without giving a buyer a reason to care. */

export default function V2Page() {
  return (
    <>
      <Hero />            {/* 1 — explain instantly + proof metrics   */}
      <VisibilityGap />   {/* 2 — urgency                            */}
      <RetailAudit />     {/* 3 — what we measure                    */}
      <Decisions />       {/* 4 — what you'll SEE                    */}
      <InsightToAction /> {/* 5 — what you'll DO (closes on measure) */}
      <Trust />           {/* 6 — can I trust it                     */}
      <Beyond />          {/* 7 — the 25% + one market view          */}
      <ProofStrip />      {/* 8 — credibility before the ask         */}
      <RequestSection />  {/* 9 — convert                            */}
    </>
  );
}
