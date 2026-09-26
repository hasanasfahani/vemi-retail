/* A change, stated with its own significance.

   Under a rotating panel most small movements are sampling noise. A
   delta below the detection floor reads "flat", so nobody builds a plan
   on a 0.4pt swing the panel cannot resolve.

   Direction is shown with ▲/▼ and the figure, never with red or green
   (brand rule): the arrow up takes Violet 700, everything else stays
   Ink. `goodUp` is kept for callers but no longer colours anything. */

import { isMaterial } from "./health";

export default function Delta({
  value,
  unit = "pt",
  floor = 0,
  label,
}: {
  value: number;
  unit?: string;
  floor?: number;
  goodUp?: boolean;
  label?: string;
}) {
  const material = isMaterial(value, floor);
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const shown = Math.abs(value).toFixed(Math.abs(value) < 10 ? 1 : 0);

  return (
    <span className="mono inline-flex items-baseline gap-1 text-xs font-medium text-ink-900">
      {material ? (
        <>
          <span aria-hidden className={value > 0 ? "text-violet-ink" : ""}>
            {value > 0 ? "▲" : value < 0 ? "▼" : "–"}
          </span>
          {sign}
          {shown}
          {unit}
        </>
      ) : (
        <span className="text-ink-500">flat</span>
      )}
      {label && <span className="font-normal text-ink-500">{label}</span>}
    </span>
  );
}
