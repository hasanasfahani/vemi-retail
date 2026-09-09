/* Store-level comparison — the ONLY cut where comparing an individual
   outlet across months means anything, because it is the only one
   where the same door sits on both ends of the line.

   Everything else on the Historical page is a market, city or channel
   aggregate, for exactly this reason. */

import { cityName } from "./index";
import type { MarketView } from "./filters";

const r1 = (n: number) => Math.round(n * 10) / 10;

export type RepeatedRow = {
  posId: string;
  name: string;
  location: string;
  before: number;
  after: number;
  delta: number;
  availabilityBefore: number | null;
  availabilityAfter: number | null;
  availabilityDelta: number;
};

export function repeated(before: MarketView, after: MarketView): RepeatedRow[] {
  const beforeScores = new Map(before.scores.map((s) => [s.posId, s]));

  return after.outlets
    .flatMap((outlet) => {
      const first = beforeScores.get(outlet.id);
      const second = after.scores.find((s) => s.posId === outlet.id);
      if (!first || !second) return [];
      return [
        {
          posId: outlet.id,
          name: outlet.name,
          location: `${outlet.district}, ${cityName(outlet.cityId)}`,
          before: first.score,
          after: second.score,
          delta: second.score - first.score,
          availabilityBefore: first.availability,
          availabilityAfter: second.availability,
          /* Zero rather than a number built from a missing one: a
             component that did not apply at either visit has no
             movement to report. */
          availabilityDelta:
            first.availability === null || second.availability === null
              ? 0
              : r1(second.availability - first.availability),
        },
      ];
    })
    .sort((a, b) => b.delta - a.delta);
}
