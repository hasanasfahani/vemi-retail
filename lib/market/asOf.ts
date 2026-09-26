/* How a figure states its basis (brand copy rules): "As of 21 Sep
   2026" for the cycle in progress, and a comparison that names the
   window it compares against — "vs Aug 2026", never "vs last month"
   (plan D5: the data is monthly, so the named month is the honest
   window). */

import { contract, months } from "./index";

const year = (id: string) => id.slice(0, 4);

/** "Aug 2026" */
export function monthShort(id: string): string {
  const m = months.find((x) => x.id === id);
  return m ? `${m.short} ${year(id)}` : id;
}

export function priorMonthId(id: string): string | null {
  const i = months.findIndex((m) => m.id === id);
  return i > 0 ? months[i - 1].id : null;
}

/** "vs Aug 2026" for the month before `id`. */
export function vsPrior(id: string = contract.currentMonth): string {
  const p = priorMonthId(id);
  return p ? `vs ${monthShort(p)}` : "vs the prior cycle";
}

/** "As of 21 Sep 2026" while a cycle is open; "Aug 2026 cycle" once closed. */
export function asOf(id: string = contract.currentMonth): string {
  if (id === contract.currentMonth) {
    const m = months.find((x) => x.id === id);
    return `As of ${contract.daysElapsed} ${m?.short ?? ""} ${year(id)}`;
  }
  return `${monthShort(id)} cycle`;
}
