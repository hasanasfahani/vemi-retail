import { faq } from "@/lib/content";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";
import FaqItem from "@/components/ui/FaqItem";

export default function Faq() {
  return (
    <section id="faq" className="section">
      <div className="container-vemi">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <Label>{faq.label}</Label>
              <h2 className="t-h2 mt-4">{faq.headline}</h2>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="border-t border-line">
              {faq.items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
