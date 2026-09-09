/* ============================================================
   THE MONEY SOCKET.

   Facing-days persuade an operator; money persuades the person who
   signs. The conversion is one number — revenue per facing per day —
   and this file is where it is built.

   READ THIS BEFORE CHANGING THE NUMBER.

   It has two inputs and they are not the same KIND of thing, so they
   stay two named constants rather than collapsing into one figure
   somebody would later mistake for a measurement:

     AVG_SHELF_PRICE_IQD   MEASURED. The facings-weighted mean shelf
                           price of the client's lines, computed from
                           this month's own price readings. It moves
                           when the audit moves.

     UNITS_PER_FACING_DAY  ASSUMED. How many units one facing sells in
                           a day. A shelf audit records what is ON the
                           shelf; it never observes what leaves it, so
                           no amount of care with this data yields this
                           number. It is a planning assumption, and it
                           is the only one in the file.

   Because the second input is assumed, every figure downstream is
   MODELLED, not measured — and the product says so on screen wherever
   money appears. That line is not decoration; it is what keeps a
   modelled IQD total honest, and a money figure must never ship
   without it.
   ============================================================ */

import { clientBrand, current, skuOf } from "./index";

/* ---------- input 1: measured ----------

   Weighted by facings rather than by reading, because a facing-day of
   2.25L PET is not worth what a facing-day of a 330ml can is, and the
   impact figures this converts are counted in facings. An unweighted
   mean would price a rack of large bottles at the average of the range
   it happens to sit in. */
function facingsWeightedClientPrice(): number {
  const facings = new Map<string, number>();
  for (const cell of current.cells) {
    if (cell.state === "in-stock") facings.set(`${cell.posId}|${cell.skuId}`, cell.facings);
  }

  let value = 0;
  let weight = 0;
  for (const reading of current.prices) {
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
   conservative end deliberately: a single carbonated facing in Iraqi
   traditional grocery turning under two units a day is a claim nobody
   has to defend, and understating a loss is the safer error when the
   figure is used to argue for spend.

   This is the line to change when the client shares a real rate of
   sale. Nothing else in the file moves. */
export const UNITS_PER_FACING_DAY = 1.5;

/* Dinars of shelf revenue per facing, per day. Derived from the two
   inputs above — never type a figure straight in here, or the
   derivation stops being inspectable. */
export const IQD_PER_FACING_DAY: number | null =
  AVG_SHELF_PRICE_IQD > 0 ? Math.round(AVG_SHELF_PRICE_IQD * UNITS_PER_FACING_DAY) : null;

const nf = new Intl.NumberFormat("en-US");

export function formatIqd(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}bn`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return nf.format(Math.round(value));
}

/* Facing-days → money, or facing-days when there is no price to
   convert with. Every money figure in the portal passes through here,
   so changing the assumption changes all of them at once. */
export function formatImpact(facingDays: number): string {
  const rounded = Math.round(facingDays);
  if (IQD_PER_FACING_DAY === null) {
    return `${nf.format(rounded)} facing-day${rounded === 1 ? "" : "s"}`;
  }
  return `≈${formatIqd(rounded * IQD_PER_FACING_DAY)} IQD`;
}

export const impactIsMonetary = IQD_PER_FACING_DAY !== null;

export function moneyOf(facingDays: number): number | null {
  return IQD_PER_FACING_DAY === null ? null : Math.round(facingDays * IQD_PER_FACING_DAY);
}

/* The assumption, stated wherever money appears, so nobody mistakes a
   modelled figure for measured revenue. If you add a new money
   surface, carry this line onto it. */
export const impactAssumption =
  IQD_PER_FACING_DAY === null
    ? null
    : `Modelled, not measured. ${nf.format(AVG_SHELF_PRICE_IQD)} IQD is the facings-weighted average shelf price of ${clientBrand.name} lines in this month's audit; ${UNITS_PER_FACING_DAY} units per facing per day is a planning assumption, because a shelf audit records what is on the shelf and not what sells. One facing-day is therefore valued at ${nf.format(IQD_PER_FACING_DAY)} IQD. Replace the rate of sale with your own and every figure here moves with it.`;

export const impactAssumptionShort =
  IQD_PER_FACING_DAY === null
    ? null
    : `Modelled at ${nf.format(IQD_PER_FACING_DAY)} IQD per facing-day — measured shelf price × an assumed ${UNITS_PER_FACING_DAY} units/day.`;
