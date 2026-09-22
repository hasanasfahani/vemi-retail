import { proofBar } from "@/lib/v2Content";

/* One hairline band, five facts, vertical rules between. Not cards —
   cards would turn credibility into decoration. */

export default function ProofBar() {
  return (
    <section className="border-y border-line bg-canvas">
      <div className="container-vemi">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {proofBar.map((p, i) => (
            <li
              key={p.label}
              className={`px-4 py-6 text-center lg:text-left ${
                i > 0 ? "lg:border-l lg:border-line" : ""
              }`}
            >
              <div className="tnum !text-xl text-ink-900">{p.value}</div>
              <div className="mt-1 text-xs text-ink-500">{p.label}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
