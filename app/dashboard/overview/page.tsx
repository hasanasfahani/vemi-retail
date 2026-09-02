import Link from "next/link";
import { OutletButton } from "@/components/portal/OutletDrawer";
import PageHeader from "@/components/portal/PageHeader";
import CoverageMap from "@/components/portal/CoverageMap";
import ShelfPhotos from "@/components/portal/ShelfPhotos";
import StatTile from "@/components/portal/charts/StatTile";
import { scope } from "@/lib/portal";
import {
  headline,
  clientBrand,
  competitors,
  brandName,
  oos,
  skuName,
} from "@/lib/portalData";

export const metadata = {
  title: "Overview",
};

/* The narrative line: what actually moved between the two visits. */
function movers() {
  const ranked = [...competitors].sort(
    (a, b) => Math.abs(b.shareDelta) - Math.abs(a.shareDelta)
  );
  const gainer = ranked.find((r) => r.shareDelta > 0);
  const loser = ranked.find((r) => r.shareDelta < 0);
  const worstOos = oos[0]; // rows arrive ranked by lost facing-days
  return { gainer, loser, worstOos };
}

export default function OverviewPage() {
  const { gainer, loser, worstOos } = movers();
  const clientRow = competitors.find((c) => c.isClient)!;
  const rank = competitors.findIndex((c) => c.isClient) + 1;

  return (
    <>
      <PageHeader title="Overview" lead="Your market at a glance" />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="On-shelf availability"
          value={`${headline.availability}%`}
          delta={headline.availabilityDelta}
          goodDirection="up"
        />
        <StatTile
          label="Shelf share"
          value={`${headline.shelfShare}%`}
          delta={headline.shelfShareDelta}
          goodDirection="up"
          footnote={`Rank ${rank} of ${competitors.length} in category`}
        />
        <StatTile
          label="Price compliance"
          value={`${headline.priceCompliance}%`}
          footnote={`Across ${clientBrand.name} SKUs at RRP ±5%`}
        />
        <StatTile
          label="Active out-of-stocks"
          value={`${headline.activeOos}`}
          goodDirection="down"
          footnote={`${headline.oosDays} lost shelf-days this cycle`}
        />
      </div>

      {/* what moved */}
      <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <h2 className="t-h3">What moved since {scope.previousVisit}</h2>
        <ul className="mt-3 space-y-2.5 text-sm text-ink-700">
          <li className="flex gap-2.5">
            <Bullet tone={clientRow.shareDelta >= 0 ? "good" : "critical"} />
            <span>
              <strong className="text-ink-900">{clientBrand.name}</strong> holds{" "}
              <strong className="text-ink-900">{clientRow.share}%</strong> of
              category facings
              {clientRow.shareDelta !== 0 && (
                <>
                  , {clientRow.shareDelta > 0 ? "up" : "down"}{" "}
                  {Math.abs(clientRow.shareDelta)}pt
                </>
              )}
              , with availability at {clientRow.availability}%.
            </span>
          </li>
          {gainer && (
            <li className="flex gap-2.5">
              <Bullet tone="warn" />
              <span>
                <strong className="text-ink-900">
                  {brandName(gainer.brandId)}
                </strong>{" "}
                gained the most facings this cycle — up {gainer.shareDelta}pt to{" "}
                {gainer.share}%.
              </span>
            </li>
          )}
          {loser && loser.brandId !== clientBrand.id && (
            <li className="flex gap-2.5">
              <Bullet tone="good" />
              <span>
                <strong className="text-ink-900">
                  {brandName(loser.brandId)}
                </strong>{" "}
                lost {Math.abs(loser.shareDelta)}pt of shelf, down to{" "}
                {loser.share}%.
              </span>
            </li>
          )}
          {worstOos && (
            <li className="flex gap-2.5">
              <Bullet tone="critical" />
              <span>
                Longest-running gap:{" "}
                <strong className="text-ink-900">
                  {skuName(worstOos.skuId)}
                </strong>{" "}
                at <OutletButton posId={worstOos.posId} /> —{" "}
                <strong className="text-ink-900">{worstOos.daysOut} days</strong>{" "}
                off shelf, {worstOos.normalFacings} facings of space.{" "}
                <Link
                  href="/dashboard/oos-alerts"
                  className="font-semibold text-violet-ink hover:underline"
                >
                  See all {oos.length}
                </Link>
              </span>
            </li>
          )}
        </ul>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* coverage */}
        <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="t-h3">Coverage</h2>
            <p className="mt-1 text-sm text-ink-500">
              Live in {scope.city}. Select any governorate to see what it adds.
            </p>
          </div>
          <CoverageMap />
        </section>

        {/* photography */}
        <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="t-h3">From the shelf</h2>
            <p className="mt-1 text-sm text-ink-500">
              Geo-stamped in store on {scope.dataAsOf}. Every figure above traces
              back to frames like these.
            </p>
          </div>
          <ShelfPhotos />

          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13px]">
            <Row label="Outlets audited" value={`${scope.posCount}`} />
            <Row label="SKUs tracked" value={`${scope.skuCount}`} />
            <Row
              label="Category gaps found"
              value={`${headline.totalOos}`}
              tone="critical"
            />
          </dl>
        </section>
      </div>
    </>
  );
}

function Bullet({ tone }: { tone: "good" | "warn" | "critical" }) {
  const color = {
    good: "var(--color-good)",
    warn: "var(--color-warn)",
    critical: "var(--color-critical)",
  }[tone];
  return (
    <span
      className="mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full"
      style={{ background: color }}
      aria-hidden
    />
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "critical";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className="mono font-semibold"
        style={{
          color: tone === "critical" ? "var(--color-critical)" : "var(--color-ink-900)",
        }}
      >
        {value}
      </dd>
    </div>
  );
}
