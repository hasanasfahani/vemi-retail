import { gap } from "@/lib/v2Content";
import { Figure } from "@/components/v2/Figure";

/* The section's whole argument in one figure: what the paperwork claims,
   what the shelf actually shows, and the hatched distance between them. */

const w = gap.widget;
const delta = w.reportedValue - w.actualValue;

export default function GapWidget() {
  return (
    <div className="surface p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="t-eyebrow">{w.eyebrow}</span>
        <span className="chip !py-1 text-xs">
          <span className="dot dot-live" style={{ background: "var(--color-good)" }} />
          {w.tag}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {/* the claim */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink-500">{w.reportedLabel}</span>
            <span className="tnum !text-sm text-ink-500">
              <Figure value={`${w.reportedValue}%`} placeholder={w.placeholder} />
            </span>
          </div>
          <div className="h-3.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full"
              style={{ width: `${w.reportedValue}%`, background: "var(--color-line-strong)" }}
            />
          </div>
        </div>

        {/* the truth, with the unverified remainder exposed */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink-900">{w.actualLabel}</span>
            <span className="tnum !text-sm" style={{ color: "var(--color-violet-ink)" }}>
              <Figure value={`${w.actualValue}%`} placeholder={w.placeholder} />
            </span>
          </div>
          <div className="relative h-3.5 overflow-hidden rounded-full bg-line">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${w.actualValue}%`, background: "var(--color-violet)" }}
            />
            <div
              className="absolute inset-y-0"
              style={{
                left: `${w.actualValue}%`,
                width: `${delta}%`,
                background:
                  "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-critical) 32%, #fff) 0 4px, color-mix(in srgb, var(--color-critical) 14%, #fff) 4px 8px)",
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-xl border border-line bg-canvas p-4">
        <span className="tnum shrink-0 text-4xl" style={{ color: "var(--color-critical)" }}>
          {delta}%
        </span>
        <p className="text-sm leading-snug text-ink-700">
          <span className="font-semibold text-ink-900">{w.gapLabel}</span> — {w.gapBody}
        </p>
      </div>
    </div>
  );
}
