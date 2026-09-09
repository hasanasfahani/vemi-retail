"use client";

/* PAGE 10 · Audit Setup — what is being monitored, and what "good"
   means.

   The KPI targets here are live: change one and every band, badge and
   headline in the portal moves with it. The rules engine does NOT
   move, and the page says so — a target is a contractual goal, while a
   threshold is calibrated to what this market actually varies by, and
   letting a target silence a finding would mean a problem could be
   made to disappear by shifting a goalpost. */

import { useState } from "react";
import PageShell from "@/components/market/PageShell";
import { Card, DataTable, StatCard, Toasts, useToasts, type Column } from "@/components/market/ui";
import Badge from "@/components/market/ui/Badge";
import Bar from "@/components/market/ui/Bar";
import { useTargets } from "@/components/market/useTargets";
import { brandColor } from "@/components/market/charts";
import {
  DEFAULT_TARGETS, TARGET_META, resetTargets, setTarget, type Targets,
} from "@/lib/market/settings";
import {
  auditors, brands, channels, governorates, clientBrand, contract, monthLabel,
  requiredSkus, skus,
} from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";
import type { Sku } from "@/lib/market/types";

export default function SetupView() {
  return <PageShell>{(view) => <Setup view={view} />}</PageShell>;
}

function Setup({ view }: { view: MarketView }) {
  const targets = useTargets();
  const { toasts, push, dismiss } = useToasts();
  const [dirty, setDirty] = useState(false);

  const change = (id: keyof Targets, value: number) => {
    setTarget(id, value);
    setDirty(true);
  };

  const skuColumns: Column<Sku>[] = [
    {
      id: "name",
      header: "SKU",
      sortValue: (s) => s.name,
      render: (s) => (
        <span className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{ background: brandColor(s.brandId) }}
            aria-hidden
          />
          <span className="font-medium text-ink-900">{s.name}</span>
        </span>
      ),
    },
    {
      id: "brand",
      header: "Brand",
      sortValue: (s) => s.brandId,
      render: (s) => brands.find((b) => b.id === s.brandId)?.name ?? s.brandId,
    },
    { id: "pack", header: "Pack", sortValue: (s) => s.pack, render: (s) => s.pack.replace("-", " ") },
    {
      id: "rrp",
      header: `RRP (${contract.currency})`,
      align: "right",
      sortValue: (s) => s.rrp,
      render: (s) => s.rrp.toLocaleString(),
    },
    {
      id: "monitored",
      header: "Monitored",
      render: () => <Badge band="strong" label="Active" size="sm" />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ---------- subscription ---------- */}
      <Card
        title={`${monthLabel(contract.currentMonth)} audit`}
        lead={`${contract.client} — ${contract.brand} ${contract.country}`}
      >
        <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { k: "Category", v: contract.category },
            { k: "Market", v: contract.country },
            { k: "Contracted", v: `${contract.contractedPos.toLocaleString()} POS` },
            { k: "Frequency", v: "Monthly audit" },
            { k: "Core panel", v: `${contract.corePanel.toLocaleString()} POS` },
            { k: "Currency", v: contract.currency },
          ].map((item) => (
            <div key={item.k}>
              <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                {item.k}
              </dt>
              <dd className="mt-0.5 text-[13px] font-semibold text-ink-900">{item.v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* ---------- KPI targets ---------- */}
      <Card
        title="KPI targets"
        lead="What this client has agreed to be measured against."
        action={
          dirty ? (
            <button
              type="button"
              onClick={() => {
                resetTargets();
                setDirty(false);
                push("Targets restored to the contracted values.");
              }}
              className="rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
            >
              Restore contracted targets
            </button>
          ) : undefined
        }
        footnote="Changing a target rebands every figure in the portal — tiles, badges, headlines and the monthly report. It does NOT change what the insight engine flags: those thresholds are calibrated to the spread this market actually shows, and a problem should not be able to disappear because a goal moved."
      >
        <ul className="flex flex-col">
          {TARGET_META.map((meta) => {
            const value = targets[meta.id];
            const changed = value !== DEFAULT_TARGETS[meta.id];
            return (
              <li key={meta.id} className="border-b border-line py-3 last:border-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-[210px] flex-1">
                    <p className="text-[12.5px] font-semibold text-ink-900">{meta.label}</p>
                    <p className="text-[11px] text-ink-400">{meta.hint}</p>
                  </div>

                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={1}
                    value={value}
                    onChange={(e) => change(meta.id, Number(e.target.value))}
                    aria-label={`${meta.label} target`}
                    className="h-1.5 w-[180px] cursor-pointer accent-[color:var(--color-violet)]"
                  />

                  <label className="flex items-center gap-1.5">
                    <span className="sr-only">{meta.label} target value</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={value}
                      onChange={(e) => change(meta.id, Number(e.target.value))}
                      className="w-[68px] rounded-[8px] border border-line-strong bg-white px-2 py-1 text-right text-[12.5px] font-semibold text-ink-900 outline-none transition-colors focus:border-violet"
                    />
                    <span className="text-[12px] text-ink-400">
                      {meta.id === "score" ? "/100" : "%"}
                    </span>
                  </label>

                  {changed && (
                    <Badge
                      band="average"
                      label={`was ${DEFAULT_TARGETS[meta.id]}`}
                      size="sm"
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* ---------- monitored brands ---------- */}
      <section>
        <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Monitored brands
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {brands.map((brand) => {
            const own = skus.filter((s) => s.brandId === brand.id);
            const row = view.byBrand.find((b) => b.brandId === brand.id);
            return (
              <div
                key={brand.id}
                className={`flex min-w-0 flex-col rounded-[14px] border bg-white p-3.5 shadow-[var(--shadow-card)] ${
                  brand.id === clientBrand.id ? "border-violet-100" : "border-line"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={{ background: brandColor(brand.id) }}
                    aria-hidden
                  />
                  <p className="min-w-0 truncate text-[13px] font-semibold text-ink-900">
                    {brand.name}
                  </p>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-ink-400">{brand.owner}</p>
                <p className="mono mt-2 text-[11.5px] text-ink-500">
                  {own.length} SKU{own.length === 1 ? "" : "s"} monitored
                </p>
                {row && (
                  <p className="mono mt-0.5 text-[11.5px] text-ink-400">
                    {row.share}% of shelf this cycle
                  </p>
                )}
                {brand.id === clientBrand.id && (
                  <span className="mt-2">
                    <Badge band="average" label="Your brand" size="sm" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- monitored SKUs ---------- */}
      <Card
        title="Monitored SKUs"
        lead={`${skus.length} lines checked at every audited outlet.`}
        padded={false}
        footnote="Every SKU is checked at every audited outlet, so an absent line is an observation rather than a missing record — which is what lets the portal tell a distribution gap from a stockout."
      >
        <DataTable
          rows={skus}
          columns={skuColumns}
          rowKey={(s) => s.id}
          searchable
          searchText={(s) => `${s.name} ${s.pack}`}
          searchPlaceholder="Search SKUs…"
          defaultSort={{ id: "brand", dir: "asc" }}
          exportName="monitored-skus"
          pageSize={12}
          dense
        />
      </Card>

      {/* ---------- coverage scope ---------- */}
      <section>
        <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Coverage scope
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Governorates" value={governorates.length} footnote={governorates.map((c) => c.name).join(", ")} />
          <StatCard label="Channels" value={channels.length} footnote={channels.map((c) => c.name).join(", ")} />
          <StatCard label="Contracted outlets" value={contract.contractedPos} footnote="Per monthly cycle" />
          <StatCard
            label="Audited so far"
            value={view.posCount}
            target={100}
            band={view.coveragePct >= 70 ? "strong" : "attention"}
            footnote={`${view.coveragePct}% of the contract, ${contract.daysRemaining} days left`}
          />
        </div>

        <Card className="mt-3" title="Where the outlets sit" lead="Contracted universe by governorate, and how much of it this cycle has reached.">
          <ul className="flex flex-col">
            {governorates.map((city) => {
              const audited = view.outlets.filter((o) => o.governorateId === city.id).length;
              const pct = city.pos ? Math.round((audited / city.pos) * 1000) / 10 : 0;
              return (
                <li key={city.id} className="border-b border-line py-2.5 last:border-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12.5px] font-medium text-ink-700">
                      {city.name}
                      {city.capital !== city.name && (
                        <span className="ml-1.5 text-[11px] text-ink-400">{city.capital}</span>
                      )}
                    </span>
                    <span className="mono text-[12px] text-ink-900">
                      {audited.toLocaleString()} / {city.pos.toLocaleString()}
                      <span className="ml-1.5 text-ink-400">{pct}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Bar value={pct} max={100} par={contract.coveragePct} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* ---------- required range ---------- */}
      <Card
        title="Expected range by channel"
        lead="How many client SKUs each format is expected to carry — the bar assortment compliance is measured against."
      >
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {channels.map((channel) => (
            <li key={channel.id} className="rounded-[10px] border border-line px-3 py-2.5">
              <p className="text-[12px] font-semibold text-ink-900">{channel.name}</p>
              <p className="mono mt-0.5 text-[16px] font-bold text-ink-900">
                {requiredSkus[channel.id] ?? "—"}
                <span className="ml-1 text-[11px] font-normal text-ink-400">SKUs expected</span>
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* ---------- field team ---------- */}
      <Card
        title="Field team"
        lead="The auditors covering this contract, and the governorates on each route."
      >
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {auditors.map((auditor) => (
            <li key={auditor.id} className="rounded-[10px] border border-line px-3 py-2.5">
              <p className="text-[12.5px] font-semibold text-ink-900">{auditor.name}</p>
              <p className="mt-0.5 text-[11.5px] text-ink-500">
                {auditor.governorates.map((c) => governorates.find((x) => x.id === c)?.name ?? c).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
