import Hero from "@/components/sections/Hero";
import Problem from "@/components/sections/Problem";
import Solution from "@/components/sections/Solution";
import SocialProof from "@/components/sections/SocialProof";
import Coverage from "@/components/sections/Coverage";
import UseCases from "@/components/sections/UseCases";
import Packages from "@/components/sections/Packages";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <SocialProof />
      <Coverage />
      <UseCases />
      <Packages />
      <Faq />
      <FinalCta />
    </>
  );
}
