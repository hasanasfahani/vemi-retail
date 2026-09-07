/* ============================================================
   The money socket.

   Facing-days persuade an operator; money persuades the person who
   signs. The conversion is one number — revenue per facing per day —
   and it is not available yet, so this file exists to hold the wiring
   with the socket deliberately empty.

   When the real figure arrives it is a ONE LINE edit here, and every
   axis label, stat tile and insight card in the product switches to
   money at once, because they all format through `formatImpact`
   rather than composing their own strings.

   Until then: no invented figure. Not as a placeholder, not as a
   plausible-looking default, not in a screenshot. This portal's
   credibility rests on numbers a buyer can trace back to a real audit
   of a real shelf — a confident IQD total resting on a guessed
   multiplier costs more than the blank it replaces.
   ============================================================ */

/* Iraqi dinar of shelf revenue per facing, per day. Null until a real
   figure is supplied from the field; never guess it. */
export const IQD_PER_FACING_DAY: number | null = null;

const nf = new Intl.NumberFormat("en-US");

/* The single formatter every impact figure passes through.

   Unset  → "140 facing-days"      (what ships today)
   Set    → "≈2.1M IQD"            (the whole product, one line later)  */
export function formatImpact(facingDays: number): string {
  const rounded = Math.round(facingDays);
  if (IQD_PER_FACING_DAY === null) {
    return `${nf.format(rounded)} facing-day${rounded === 1 ? "" : "s"}`;
  }
  return `≈${formatIqd(rounded * IQD_PER_FACING_DAY)} IQD`;
}

/* Compact axis form — same rule, fewer characters, for tick labels
   where a full phrase would collide with its neighbour. */
export function formatImpactShort(facingDays: number): string {
  const rounded = Math.round(facingDays);
  if (IQD_PER_FACING_DAY === null) return nf.format(rounded);
  return formatIqd(rounded * IQD_PER_FACING_DAY);
}

/* True when charts may draw a money axis. Read this rather than
   testing the constant directly, so the check reads as intent. */
export const impactIsMonetary = IQD_PER_FACING_DAY !== null;

/* The assumption, stated on screen wherever money appears — so nobody
   mistakes a modelled figure for measured revenue. Null while the
   product is still counting facing-days. */
export const impactAssumption =
  IQD_PER_FACING_DAY === null
    ? null
    : `Assumes ${nf.format(IQD_PER_FACING_DAY)} IQD per facing per day.`;

function formatIqd(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return nf.format(Math.round(value));
}
