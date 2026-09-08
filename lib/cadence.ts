/* When work is due, derived from when the shelf is next looked at.

   The default deadline for almost everything the engine finds is the
   next field visit, because that is when a fix gets verified — and it
   makes the engine's own language true. R1 flags a gap "confirmed at
   both visits"; an action closed before the next visit is precisely
   one that will not be confirmed twice. The deadline and the rule
   finally describe the same event.

   The interval is measured from the real snapshots rather than
   assumed: the visit ids are ISO dates, so the cadence is arithmetic
   on the data, not a constant someone picked. */

import { meta } from "./portalData";

const DAY = 86_400_000;

const sorted = [...meta.windows].map((w) => w.id).sort();
const current = sorted[sorted.length - 1];

/* The planned gap between audits of the SAME outlet, which under a
   rotating schedule is a property of the collection plan rather than
   something you can measure off two snapshot dates. It is the same
   figure every forward loss estimate uses, read from one place. */
export const VISIT_INTERVAL_DAYS = meta.revisitIntervalDays;

/* The next visit, as an ISO date. If that date has already passed —
   the panel is overdue for an audit — fall back to a week out rather
   than proposing a deadline in the past, which no one can act on. */
export function nextVisitDate(today = new Date()): string {
  const next = Date.parse(current) + VISIT_INTERVAL_DAYS * DAY;
  const iso = new Date(next).toISOString().slice(0, 10);
  const todayIso = today.toISOString().slice(0, 10);
  if (iso > todayIso) return iso;
  return new Date(today.getTime() + 7 * DAY).toISOString().slice(0, 10);
}

/* Says how far away a chosen date is, in the cycle's own terms.

   This deliberately surfaces a squeeze rather than hiding it: late in
   a cycle the next visit is days away, and "2 days before the next
   visit" is real information about where you are, not a reason to
   quietly offer a softer default. */
export function describeDueDate(iso: string, today = new Date()): string {
  if (!iso) return "No date set — this action can never show as overdue.";
  const days = Math.round((Date.parse(iso) - today.setHours(0, 0, 0, 0)) / DAY);
  const nextVisit = Date.parse(current) + VISIT_INTERVAL_DAYS * DAY;
  const isNextVisit = iso === new Date(nextVisit).toISOString().slice(0, 10);

  const when =
    days < 0
      ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`
      : days === 0
        ? "today"
        : `in ${days} day${days === 1 ? "" : "s"}`;

  return isNextVisit
    ? `${when} — the next field visit, when this gets re-audited.`
    : when.charAt(0).toUpperCase() + when.slice(1) + ".";
}
