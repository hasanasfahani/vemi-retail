import { beyond, ids } from "@/lib/v2Content";
import Reveal from "@/components/ui/Reveal";
import BeyondExplorer from "@/components/v2/BeyondExplorer";
import { SignalField } from "@/components/vemi/SignalField";

/* The page's one Ink band. `data-theme="dark"` switches every token to
   its Ink value (brand/tokens.css), so type, lines and violet all move
   to their on-Ink forms together. The signal field sits at the far edge,
   never behind text. */
export default function Beyond() {
  return (
    <section
      id={ids.market}
      data-theme="dark"
      className="section section-v2 relative isolate overflow-hidden bg-surface text-ink-900"
    >
      <SignalField
        colorway="ink"
        fadeFrom="right"
        cols={14}
        rows={7}
        className="absolute right-0 top-0 -z-10 hidden h-[300px] w-[44%] opacity-80 lg:block"
      />
      <div className="container-vemi">
        <Reveal>
          <div className="max-w-2xl">
            <span className="vm-label">{beyond.eyebrow}</span>
            <h2 className="t-h2 mt-4">{beyond.headline}</h2>
            <p className="t-lead mt-5">{beyond.subhead}</p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-14">
            <BeyondExplorer />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
