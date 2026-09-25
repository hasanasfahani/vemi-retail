import { ids } from "@/lib/v2Content";
import QuoteForm from "@/components/quote/QuoteForm";

/* The pricing section is now just the frame. The form itself lives in
   components/quote/QuoteForm so the portal's "Request a Quote" modal
   renders exactly the same thing — same scope sliders, same contact
   fields, same submission — rather than a copy that drifts. */

export default function RequestSection() {
  return (
    <section id={ids.request} className="section section-v2 bg-white">
      <div className="container-vemi">
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-surface)]">
          <QuoteForm idPrefix="v2" />
        </div>
      </div>
    </section>
  );
}
