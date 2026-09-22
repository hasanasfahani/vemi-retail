import Hero from "@/components/v2/Hero";
import ProofBar from "@/components/v2/ProofBar";
import Problem from "@/components/v2/Problem";
import RetailAudit from "@/components/v2/RetailAudit";
import Platform from "@/components/v2/Platform";
import HowItWorks from "@/components/v2/HowItWorks";
import Trust from "@/components/v2/Trust";
import Coverage from "@/components/v2/Coverage";
import Beyond from "@/components/v2/Beyond";
import Outcomes from "@/components/v2/Outcomes";
import RequestSection from "@/components/v2/RequestSection";

/* The 17-section structure, rendered as 13 blocks:
   §10–13 share one area, and §14/§15 pair inside Outcomes, so the
   retail-audit core (§5–9) keeps ~75% of the page weight. */

export default function V2Page() {
  return (
    <>
      <Hero />           {/* §2  */}
      <ProofBar />       {/* §3  */}
      <Problem />        {/* §4  */}
      <RetailAudit />    {/* §5  */}
      <Platform />       {/* §6  */}
      <HowItWorks />     {/* §7  */}
      <Trust />          {/* §8  */}
      <Coverage />       {/* §9  */}
      <Beyond />         {/* §10–13 */}
      <Outcomes />       {/* §14 + §15 */}
      <RequestSection /> {/* §16 + §17 */}
    </>
  );
}
