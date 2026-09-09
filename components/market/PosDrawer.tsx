"use client";

/* The outlet, opened from wherever you clicked it — a map marker, a
   table row, an insight. Basic store facts and this month's execution:
   the full detail view with photo evidence and history is the POS
   Explorer's job.

   Everything is read from the filtered view, so an outlet opened from
   a Baghdad-filtered map shows the same numbers the map marker was
   coloured by. */

import Drawer from "./ui/Drawer";
import Badge from "./ui/Badge";
import Bar from "./ui/Bar";
import ScoreRing from "./ui/ScoreRing";
import { rateBand, scoreBand } from "./ui/health";
import { channelName, cityName, kpiTargets, skuOf } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";

export default function PosDrawer({
  posId,
  view,
  onClose,
}: {
  posId: string | null;
  view: MarketView;
  onClose: () => void;
}) {
  const outlet = posId ? view.outlets.find((p) => p.id === posId) : null;
  const score = outlet ? view.scores.find((s) => s.posId === outlet.id) : null;
  const cells = outlet ? view.cells.filter((c) => c.posId === outlet.id) : [];
  const gaps = cells.filter((c) => c.state === "out-of-stock");
  const auditedAt = outlet ? view.auditedAt.get(outlet.id) : null;

  return (
    <Drawer
      open={Boolean(outlet)}
      onClose={onClose}
      title={outlet?.name ?? ""}
      subtitle={
        outlet
          ? `${outlet.code} · ${outlet.district}, ${cityName(outlet.cityId)} · ${channelName(outlet.channel)}${
              outlet.retailer === "Independent" ? "" : ` · ${outlet.retailer}`
            }`
          : undefined
      }
    >
      {outlet && score && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <ScoreRing score={score.score} size={92} />
            <dl className="min-w-0 flex-1 flex-col gap-2">
              {[
                { k: "Availability", v: score.availability, target: kpiTargets.availability },
                { k: "Shelf share", v: score.shelfShare, target: 40 },
                { k: "Assortment", v: score.assortment, target: kpiTargets.assortment },
                { k: "Price", v: score.price, target: kpiTargets.price },
                { k: "POSM", v: score.posm, target: kpiTargets.posm },
              ].map((row) => (
                <div key={row.k} className="flex items-center gap-2 py-[3px]">
                  <dt className="w-[86px] shrink-0 text-[11.5px] text-ink-500">{row.k}</dt>
                  <Bar value={row.v} max={100} par={row.target} />
                  <dd className="mono w-[42px] shrink-0 text-right text-[12px] font-semibold text-ink-900">
                    {row.v}%
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-500">
            <Badge band={scoreBand(score.score)} />
            <Badge
              band={rateBand(score.availability, kpiTargets.availability)}
              label={`${gaps.length} of ${cells.length} lines out`}
              size="sm"
            />
            {auditedAt && <span className="mono text-ink-400">audited {auditedAt}</span>}
          </div>

          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              On shelf
            </h3>
            <ul className="mt-2 flex flex-col">
              {cells.map((cell) => (
                <li
                  key={cell.skuId}
                  className="flex items-center gap-2 border-b border-line py-1.5 text-[12.5px] last:border-0"
                >
                  <span className="min-w-0 flex-1 truncate text-ink-700">
                    {skuOf(cell.skuId)?.name ?? cell.skuId}
                  </span>
                  {cell.state === "in-stock" ? (
                    <>
                      <span className="mono text-[11.5px] text-ink-400">
                        {cell.position ?? "shelf"}
                      </span>
                      <span className="mono w-[54px] text-right font-semibold text-ink-900">
                        {cell.facings} {cell.facings === 1 ? "facing" : "facings"}
                      </span>
                    </>
                  ) : (
                    <Badge band="critical" label="Out of stock" size="sm" />
                  )}
                </li>
              ))}
            </ul>
          </section>

          <p className="text-[11px] leading-snug text-ink-400">
            Position on the map is placed within {outlet.district} rather than surveyed to the
            street.
          </p>
        </div>
      )}
    </Drawer>
  );
}
