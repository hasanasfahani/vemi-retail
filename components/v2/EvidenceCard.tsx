import { trust } from "@/lib/v2Content";
import Icon from "@/components/v2/Icon";

/* One audit record, shown the way the platform stores it: the shelf as
   photographed, the machine reading with its confidence, and the human
   who signed it off. This is what "verifiable" means in practice. */

const e = trust.evidence;

/* Stylised capture — a shelf with the detected gap boxed. Stands in for
   the real geo-tagged photograph. */
function ShelfCapture() {
  const product = "#b9bdc7";
  const yours = "var(--color-violet)";
  const shelves = [12, 46, 80];
  return (
    <svg viewBox="0 0 220 116" className="h-full w-full" role="img" aria-label="Shelf photograph with the out-of-stock gap detected and boxed">
      <rect width="220" height="116" fill="#eef0f4" />
      {shelves.map((y) => (
        <rect key={y} x="8" y={y + 24} width="204" height="3" rx="1.5" fill="#d8dae0" />
      ))}
      {/* row 1 */}
      {[12, 46, 80, 114, 148, 182].map((x) => (
        <rect key={`a${x}`} x={x} y="12" width="26" height="24" rx="2" fill={x === 80 ? yours : product} />
      ))}
      {/* row 2 — the gap at x=114 */}
      {[12, 46, 80, 148, 182].map((x) => (
        <rect key={`b${x}`} x={x} y="46" width="26" height="24" rx="2" fill={x === 46 ? yours : product} />
      ))}
      {/* row 3 */}
      {[12, 46, 80, 114, 148, 182].map((x) => (
        <rect key={`c${x}`} x={x} y="80" width="26" height="24" rx="2" fill={product} />
      ))}
      {/* detection box on the empty slot */}
      <rect
        x="110"
        y="42"
        width="34"
        height="32"
        rx="3"
        fill="color-mix(in srgb, var(--color-critical) 12%, transparent)"
        stroke="var(--color-critical)"
        strokeWidth="1.6"
        strokeDasharray="4 3"
      />
      <rect x="110" y="32" width="34" height="10" rx="2" fill="var(--color-critical)" />
      <text x="127" y="39.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#fff" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
        OOS
      </text>
    </svg>
  );
}

function Meta({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon name={icon} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
        <div className="truncate text-xs font-medium text-ink-900">{value}</div>
      </div>
    </div>
  );
}

export default function EvidenceCard() {
  return (
    <div className="surface overflow-hidden">
      {/* the capture */}
      <div className="relative aspect-[220/116] border-b border-line">
        <ShelfCapture />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-ink-900 backdrop-blur">
          <Icon name="spark" className="h-3 w-3 text-violet-ink" />
          AI confidence {e.confidence}%
        </span>
        <span
          className="absolute right-3 top-3 rounded-md px-2 py-1 text-[11px] font-semibold"
          style={{
            background: "color-mix(in srgb, var(--color-warn) 18%, #fff)",
            color: "#8a6a00",
          }}
        >
          Sample record
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="t-h3 !text-base">{e.outlet}</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              {e.location} · {e.channel}
            </p>
          </div>
          <span className="pill pill-good shrink-0">
            <Icon name="check" className="h-3 w-3" />
            {e.status}
          </span>
        </div>

        {/* the finding */}
        <div
          className="mt-4 flex items-center gap-2.5 rounded-lg border border-line p-3"
          style={{ background: "color-mix(in srgb, var(--color-critical) 5%, #fff)" }}
        >
          <span className="dot shrink-0" style={{ background: "var(--color-critical)" }} />
          <span className="text-sm font-semibold text-ink-900">{e.finding}</span>
        </div>

        {/* traceability */}
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
          <Meta icon="pin" label="Location" value={e.location} />
          <Meta icon="clock" label="Captured" value={e.captured} />
          <Meta icon="people" label="Collected by" value={e.auditor} />
          <Meta icon="link" label="Traceable" value="Linked to dashboard" />
        </div>
      </div>
    </div>
  );
}
