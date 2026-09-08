import Link from "next/link";
import ChartFrame from "@/components/portal/ChartFrame";
import DecisionAction from "@/components/portal/DecisionAction";
import Dumbbell from "@/components/portal/charts/Dumbbell";
import DivergingBar from "@/components/portal/charts/DivergingBar";
import RankedBar from "@/components/portal/charts/RankedBar";
import SegmentedMeter from "@/components/portal/charts/SegmentedMeter";
import type { Decision } from "@/lib/decisions";
import { draftFromDecision } from "@/lib/actionDrafts";
import SnoozeButton from "@/components/portal/SnoozeButton";
import type { DecisionChart, ChartSpec } from "@/lib/decisionCharts";

/* One decision, rendered as a Story Block: the move as the headline,
   the chart that proves it, how to read that chart, and the control
   that starts it.

   The chart is chosen by the decision's own shape rather than by
   variety — a two-point comparison gets the dumbbell, a
   distance-from-my-own-average gets the diverging bar, and a plain
   "which of these is worst" gets ranked bars. */

type Props = ChartSpec & {
  decision: Decision;
  rank: number;
  /* The visit these figures describe — stamped onto any monitor the
     sheet creates, so its first reading is keyed to the right cycle. */
  visit: string;
};

/* One element, not three conditionals — a bare `cond && <X/>` trio
   reads to React as an unkeyed list. */
function renderChart(chart: DecisionChart) {
  switch (chart.kind) {
    case "diverging":
      return (
        <DivergingBar
          rows={chart.rows}
          baselineLabel={chart.baselineLabel}
          unit={chart.unit}
        />
      );
    case "dumbbell":
      return (
        <Dumbbell
          rows={chart.rows}
          aLabel={chart.aLabel}
          bLabel={chart.bLabel}
          unit={chart.unit}
        />
      );
    case "meter":
      return (
        <SegmentedMeter
          rows={chart.rows}
          unitLabel={chart.unitLabel}
          benchmarkLabel={chart.benchmarkLabel}
        />
      );
    case "ranked":
      return <RankedBar rows={chart.rows} unit={chart.unit} labelWidth={118} />;
  }
}

export default function DecisionBlock({
  decision,
  rank,
  visit,
  chart,
  chartTitle,
  chartSubtitle,
  howToRead,
  soWhat,
  table,
}: Props) {
  return (
    <article className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="mono text-[12px] text-ink-400">Decision {rank}</span>
        <span
          className={`pill ${
            decision.severity === "critical" ? "pill-critical" : "pill-warn"
          }`}
        >
          {decision.severity === "critical" ? "Critical" : "Warning"}
        </span>
        {decision.confidence === "estimated" && (
          <span className="text-[12px] text-ink-400">estimated</span>
        )}
      </div>

      <h2 className="mt-2 t-h3 !text-[19px] leading-snug">{decision.headline}</h2>
      <p className="mt-1 text-sm text-ink-500">{decision.detail}</p>
      <p className="mt-1.5 text-[13px]">
        <span className="mono font-semibold text-ink-900">
          {decision.impact.label}
        </span>
        <span className="ml-2 text-ink-400">
          across {decision.outlets} outlet{decision.outlets === 1 ? "" : "s"} ·{" "}
          {decision.findings.length} finding
          {decision.findings.length === 1 ? "" : "s"} rolled up
        </span>
      </p>

      <div className="mt-4">
        <ChartFrame
          title={chartTitle}
          subtitle={chartSubtitle}
          howToRead={howToRead}
          soWhat={soWhat}
          table={table}
          action={
            <DecisionAction draft={draftFromDecision(decision, visit)} />
          }
        >
          {renderChart(chart)}
        </ChartFrame>
      </div>

      <details className="group mt-3">
        <summary className="cursor-pointer list-none text-[12.5px] font-medium text-ink-400 hover:text-ink-700">
          <span className="group-open:hidden">
            Show the {decision.findings.length} finding
            {decision.findings.length === 1 ? "" : "s"} behind this
          </span>
          <span className="hidden group-open:inline">Hide the findings</span>
        </summary>
        <ul className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
          {decision.findings.map((f) => (
            <li key={f.id} className="text-[13px] leading-snug">
              <span className="font-semibold text-ink-900">{f.headline}</span>
              <span className="text-ink-400">
                {" "}
                — {f.impact.label} at {f.scope.label}
              </span>
              <span className="ml-2 inline-flex flex-wrap items-baseline gap-x-3">
                <Link
                  href={f.evidence.href}
                  className="text-[12px] font-semibold text-violet-ink hover:underline"
                >
                  evidence →
                </Link>
                {/* Parking is offered per FINDING, not per decision.
                    "Ignore ERB-105, it is a kiosk" is a real judgement
                    about one store; "ignore replenishment" is not a
                    judgement anyone makes. Removing findings also lets
                    the rollup above re-derive its own impact, which a
                    decision-level hide could not. */}
                <SnoozeButton insight={f} visit={visit} />
              </span>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
