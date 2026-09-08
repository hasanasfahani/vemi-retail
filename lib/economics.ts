/* ============================================================
   The money socket.

   Facing-days persuade an operator; money persuades the person who
   signs. The conversion is one number — revenue per facing per day —
   and this file is where it is built.

   READ THIS BEFORE CHANGING THE NUMBER.

   The conversion has two inputs and they are not the same KIND of
   thing, so they are kept as two named constants rather than collapsed
   into one figure someone would later mistake for a measurement:

     AVG_SHELF_PRICE_IQD   MEASURED. The facings-weighted mean shelf
                           price of the client's SKUs, computed here
                           from this visit's own price readings. It
                           moves when the audit moves.

     UNITS_PER_FACING_DAY  ASSUMED. How many units one facing sells in
                           a day. A shelf audit photographs what is on
                           the shelf; it never observes what leaves it,
                           so no amount of care with this data yields
                           this number. It is a planning assumption,
                           and it is the only one.

   Because the second input is assumed, every figure downstream is
   MODELLED, not measured — and the product says so on screen wherever
   money appears, via `impactAssumption`. That line is not decoration.
   It is the thing that keeps a modelled IQD total honest, and a money
   figure must never ship without it.

   To calibrate: change UNITS_PER_FACING_DAY to the client's own rate
   of sale and every axis label, stat tile and insight card switches at
   once, because they all format through `formatImpact`.
   ============================================================ */

import { clientBrand, latest, skuOf } from "./portalData";

/* ---------- input 1: measured ----------

   Weighted by facings rather than by reading, because a facing-day of
   2.25L PET is not worth the same as a facing-day of a 330ml can, and
   the impact figures this converts are counted in facings. An
   unweighted mean would price a rack of large PET at the average of
   the range it sits in. */
function facingsWeightedClientPrice(): number {
  const facings = new Map<string, number>();
  for (const cell of latest.matrix) {
    if (cell.state === "in-stock") facings.set(`${cell.posId}|${cell.skuId}`, cell.facings);
  }

  let value = 0;
  let weight = 0;
  for (const reading of latest.observations) {
    if (skuOf(reading.skuId)?.brandId !== clientBrand.id) continue;
    const f = facings.get(`${reading.posId}|${reading.skuId}`) ?? 0;
    value += reading.price * f;
    weight += f;
  }

  return weight ? Math.round(value / weight) : 0;
}

export const AVG_SHELF_PRICE_IQD = facingsWeightedClientPrice();

/* ---------- input 2: assumed ----------

   One facing, one day, this many units over the counter. Set at the
   conservative end: a single carbonated facing in Erbil traditional
   grocery turning under two units a day is a claim nobody has to
   defend, and understating the loss is the safer error when the number
   is used to argue for spend.

   This is the line to change when the client shares real rate of
   sale. Nothing else in the file needs to move. */
export const UNITS_PER_FACING_DAY = 1.5;

/* Iraqi dinar of shelf revenue per facing, per day. Modelled from the
   two inputs above — never type a figure straight in here, or the
   derivation stops being inspectable. */
export const IQD_PER_FACING_DAY: number | null =
  AVG_SHELF_PRICE_IQD > 0
    ? Math.round(AVG_SHELF_PRICE_IQD * UNITS_PER_FACING_DAY)
    : null;

const nf = new Intl.NumberFormat("en-US");

/* The single formatter every impact figure passes through.

   Unset  → "140 facing-days"
   Set    → "≈2.1M IQD"            */
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
   mistakes a modelled figure for measured revenue. Rendered by
   `ImpactBasis`; if you add a new money surface, add that component
   too. */
export const impactAssumption =
  IQD_PER_FACING_DAY === null
    ? null
    : `Modelled, not measured. ${nf.format(
        AVG_SHELF_PRICE_IQD
      )} IQD is the facings-weighted average shelf price of ${
        clientBrand.name
      } lines in this audit; the ${UNITS_PER_FACING_DAY} units per facing per day is a planning assumption, because a shelf audit records what is on the shelf and not what sells. One facing-day is therefore valued at ${nf.format(
        IQD_PER_FACING_DAY
      )} IQD. Replace the rate of sale with your own and every figure here moves with it.`;

/* The one-line form, for places too tight for the full statement. */
export const impactAssumptionShort =
  IQD_PER_FACING_DAY === null
    ? null
    : `Modelled at ${nf.format(
        IQD_PER_FACING_DAY
      )} IQD per facing-day — measured shelf price × an assumed ${UNITS_PER_FACING_DAY} units/day.`;

function formatIqd(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return nf.format(Math.round(value));
}
