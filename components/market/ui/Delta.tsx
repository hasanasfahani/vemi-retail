/* A change, stated with its own significance.

   Under a rotating panel most small movements are sampling noise. A
   delta below the detection floor renders as "flat" with the figure
   greyed, so nobody builds a plan on a 0.4pt swing that the panel
   cannot actually resolve. Pass `floor` wherever one has been
   measured; omit it only where the comparison is exhaustive. */

import { isMaterial } from "./health";

export default function Delta({
  value,
  unit = "pt",
  floor = 0,
  /* Down is normally bad; set false for figures where it isn't
     (out-of-stock count, price breaches). */
  goodUp = true,
  label,
}: {
  value: number;
  unit?: string;
  floor?: number;
  goodUp?: boolean;
  label?: string;
}) {
  const material = isMaterial(value, floor);
  const good = goodUp ? value > 0 : value < 0;
  const tone = !material
    ? "text-ink-400"
    : good
      ? "text-[color:var(--color-good)]"
      : "text-[color:var(--color-critical)]";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const shown = Math.abs(value).toFixed(Math.abs(value) < 10 ? 1 : 0);

  return (
    <span className={`mono inline-flex items-baseline gap-1 text-[12px] font-semibold ${tone}`}>
      {material ? (
        <>
          <span aria-hidden>{value > 0 ? "▲" : value < 0 ? "▼" : "—"}</span>
          {sign}
          {shown}
          {unit}
        </>
      ) : (
        <>flat</>
      )}
      {label && <span className="font-normal text-ink-400">{label}</span>}
    </span>
  );
}
