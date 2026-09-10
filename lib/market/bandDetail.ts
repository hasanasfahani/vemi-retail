/* ============================================================
   WHY THIS STATUS.

   A chip that says "Needs attention" is a verdict, and a verdict a
   reader cannot interrogate is one they either accept without thinking
   or dismiss without evidence. These builders produce what sits behind
   one: the cut-offs the band was decided by, where this figure falls
   against them, what it would take to reach the next band, and — where
   the status is a composite or covers a population — what it is made
   of.

   Every figure here is derived from the same rules the chip itself
   used. Nothing restates a threshold by hand, because a second copy of
   a cut-off is a second chance to disagree with the first.
   ============================================================ */

import { SCORE_BANDS, BAND_LABEL, rateBand, scoreBand, type Band } from "@/components/market/ui/health";

export type BandRow = {
  label: string;
  value: string;
  band?: Band;
  /* The row describing where this figure actually sits. */
  here?: boolean;
};

export type BandDetail = {
  lead: string;
  rows: BandRow[];
  footnote?: string;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/* ---------- a rate against its target ----------

   The bands are relative: at or above target is strong, and each step
   below widens by a tenth of the target. Stating the cut-offs in the
   measure's own units is the point — "70% is average" means nothing
   until you know the target is 85. */
export function rateBandDetail(
  value: number,
  target: number,
  unit = "%"
): BandDetail {
  const step = target * 0.1;
  const cuts: { band: Band; from: number }[] = [
    { band: "strong", from: target },
    { band: "average", from: target - step },
    { band: "attention", from: target - step * 2 },
    { band: "critical", from: 0 },
  ];
  const band = rateBand(value, target);

  const rows: BandRow[] = cuts.map((cut, i) => {
    const upper = i === 0 ? null : cuts[i - 1].from;
    return {
      label: BAND_LABEL[cut.band],
      value:
        upper === null
          ? `${r1(cut.from)}${unit} and above`
          : `${r1(cut.from)}–${r1(upper)}${unit}`,
      band: cut.band,
      here: cut.band === band,
    };
  });

  const next = cuts[cuts.findIndex((c) => c.band === band) - 1];
  return {
    lead: `${value}${unit} against a ${target}${unit} target.`,
    rows,
    footnote: next
      ? `${r1(next.from - value)}${unit} more would reach ${BAND_LABEL[next.band].toLowerCase()}.`
      : "Already at or above target.",
  };
}

/* ---------- the execution score ---------- */
export function scoreBandDetail(score: number): BandDetail {
  const band = scoreBand(score);
  const rows: BandRow[] = SCORE_BANDS.map((cut, i) => {
    const upper = i === 0 ? null : SCORE_BANDS[i - 1].min;
    return {
      label: BAND_LABEL[cut.band],
      value: upper === null ? `${cut.min} and above` : `${cut.min}–${upper - 1}`,
      band: cut.band,
      here: cut.band === band,
    };
  });
  const next = SCORE_BANDS[SCORE_BANDS.findIndex((c) => c.band === band) - 1];
  return {
    lead: `${score} out of 100 on the weighted execution score.`,
    rows,
    footnote: next
      ? `${next.min - score} more would reach ${BAND_LABEL[next.band].toLowerCase()}.`
      : "At the top band.",
  };
}

/* ---------- a composite, broken into what makes it ----------

   For a brand or a governorate the useful answer is not the cut-offs —
   it is which component is holding the score down, and by how much.
   Contribution is the component's score times its weight: the points
   it actually puts into the composite, against the points it could. */
export function componentDetail(
  score: number,
  components: { label: string; score: number; weight: number }[]
): BandDetail {
  /* Ranked by points LOST, not points contributed.

     Contributed points reward weight rather than performance: POSM can
     only ever put 10 points into the composite, so it looks like the
     smallest contributor even when it is nearly full, while shelf
     share can be a third of the way to par and still contribute more.
     For Mountain Dew that flagged POSM as the weak spot while the card
     beside it named shelf share — the popover and the card disagreeing
     about the same brand. Lost points is the measure that matches what
     "main gap" means everywhere else. */
  const lost = (part: { score: number; weight: number }) =>
    (1 - part.score / 100) * part.weight * 100;
  const worst = [...components].sort((a, b) => lost(b) - lost(a))[0];

  return {
    lead: `${score} out of 100, weighted across five measures.`,
    rows: components.map((part) => ({
      label: part.label,
      value: `${part.score}% × ${Math.round(part.weight * 100)}% = ${r1(
        part.score * part.weight
      )} pts`,
      here: part.label === worst.label,
    })),
    footnote: worst
      ? `${worst.label} costs the most — ${r1(lost(worst))} of the ${Math.round(
          worst.weight * 100
        )} points it could contribute are missing.`
      : undefined,
  };
}

/* ---------- how a population is spread across the bands ----------

   A market average of 87% can be a market where everything is 87%, or
   one where half is excellent and half is failing. The distribution is
   the difference, and it is the thing an average is worst at telling
   you. */
export function distributionDetail(
  values: number[],
  target: number,
  unit = "%"
): BandDetail | null {
  const usable = values.filter((v) => Number.isFinite(v));
  if (usable.length === 0) return null;

  const counts = new Map<Band, number>();
  for (const value of usable) {
    const band = rateBand(value, target);
    counts.set(band, (counts.get(band) ?? 0) + 1);
  }
  const order: Band[] = ["strong", "average", "attention", "critical"];

  return {
    lead: `${usable.length.toLocaleString()} audited outlets, by where each one sits against the ${target}${unit} target.`,
    rows: order.map((band) => {
      const n = counts.get(band) ?? 0;
      return {
        label: BAND_LABEL[band],
        value: `${n.toLocaleString()} · ${r1((n / usable.length) * 100)}%`,
        band,
      };
    }),
    footnote:
      "An average hides this. The same figure can describe a steady market or a split one.",
  };
}
