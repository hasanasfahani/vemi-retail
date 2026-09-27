"use client";

import { useState, type ReactNode } from "react";
import {
  AlertChip, BandChip, Button, Card, ChartCard, ConfidenceBadge, Dialog, Drawer, EmptyState, Gauge,
  Icon, ICON_NAMES, IconButton, InfoPopover, KpiCard, LockedRegion, Logo, LogoBilingual, LogoDescriptor,
  Mark, PageHeader, SegmentedControl, SelectField, SignalField, Skeleton, Tabs, TextField, TextareaField,
  Toasts, useToasts, buttonClass,
} from "@/components/vemi";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="vm-label">{title}</h2>
      {children}
    </section>
  );
}

const Row = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap items-center gap-3">{children}</div>;

export default function KitView() {
  const [tab, setTab] = useState("availability");
  const [win, setWin] = useState<"m" | "q" | "y">("m");
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  return (
    <main className="mx-auto flex max-w-[1360px] flex-col gap-12 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Vemi · Design system"
        title="Component sheet"
        description="Every brand component in every state, drawn from the tokens in brand/."
        actions={<Button variant="secondary">Export sheet</Button>}
      />

      <Section title="Logo">
        <Card>
          <Row>
            <Logo height={32} />
            <LogoDescriptor height={28} />
            <LogoBilingual height={40} />
            <Mark size={32} />
            <Mark size={16} />
          </Row>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center rounded-lg bg-primary p-8"><Logo height={32} tone="reversed" /></div>
          <div className="flex items-center rounded-lg bg-[color:var(--vm-text)] p-8"><LogoBilingual height={40} tone="onInk" /></div>
        </div>
      </Section>

      <Section title="Buttons">
        <Row>
          <Button>Request quote</Button>
          <Button variant="secondary" iconStart={<Icon name="download" size={16} />}>Export report</Button>
          <Button variant="text">View outlets</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm" variant="secondary">Small secondary</Button>
          <a href="#top" className={buttonClass("secondary")}>Link as button</a>
          <IconButton label="Notifications"><Icon name="bell" /></IconButton>
        </Row>
      </Section>

      <Section title="Fields">
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <TextField label="Full name" placeholder="Your name" />
          <TextField label="Work email" defaultValue="name@gmail" error="Use your company email, e.g. name@company.com." />
          <SelectField label="Industry" hint="We tailor the walkthrough to it." defaultValue="">
            <option value="" disabled>Select your industry</option>
            <option>Beverages</option>
            <option>Packaged food</option>
          </SelectField>
          <TextareaField label="Notes" optional placeholder="Anything we should know" />
        </div>
      </Section>

      <Section title="Badges, bands, alert">
        <Row>
          <ConfidenceBadge level="measured" />
          <ConfidenceBadge level="estimated" />
          <ConfidenceBadge level="stale" />
        </Row>
        <p className="vm-label">Vemi surface (website)</p>
        <Row>
          <BandChip band="strong" />
          <BandChip band="average" />
          <BandChip band="attention" />
          <BandChip band="critical" />
          <BandChip band="neutral" label="Pending" />
          <BandChip band="critical" size="sm" label="Out of stock" />
        </Row>
        <Row>
          <AlertChip>Critical · 29 outlets in Basra</AlertChip>
        </Row>
        <p className="vm-label">Client portal surface (data-surface=&quot;portal&quot;)</p>
        <div data-surface="portal" className="flex flex-col gap-4 text-text">
          <Row>
            <BandChip band="strong" />
            <BandChip band="average" />
            <BandChip band="attention" />
            <BandChip band="critical" />
            <BandChip band="neutral" label="Pending" />
            <BandChip band="critical" size="sm" label="Out of stock" />
          </Row>
          <Row>
            <AlertChip band="critical">Critical · 29 outlets in Basra</AlertChip>{/* brand-check-ignore: specimen of the portal surface */}
          </Row>
        </div>
      </Section>

      <Section title="KPI cards">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Availability" value="87.6" unit="%" confidence="measured"
            delta={{ change: "1.2 pts", window: "vs Aug 2026", direction: "up", outcome: "better" }}
            asOf="As of 26 Sep" base="742 outlets"
            top={<InfoPopover label="How availability is measured">Listings on shelf divided by listings expected, across every audited outlet.</InfoPopover>}>
            <Gauge value={87.6} target={95} />
            <BandChip band="average" size="sm" />
          </KpiCard>
          <KpiCard label="Shelf share" value="34" unit="%" delta={{ change: "0 pts", window: "vs Aug 2026", direction: "flat" }} asOf="As of 26 Sep" base="742 outlets">
            <Gauge value={34} target={40} />
          </KpiCard>
          <KpiCard size="compact" label="Lost sales" value="IQD 41.2M" confidence="estimated"
            delta={{ change: "3.1M", window: "vs Aug 2026", direction: "down", outcome: "better" }} asOf="As of 26 Sep" base="91 outlets" />
          <KpiCard size="compact" label="Outlets audited" value="742" unit="/ 1,000" asOf="As of 26 Sep" />
        </div>
      </Section>

      <Section title="Chart card, tabs, segmented control">
        <Tabs
          ariaLabel="Performance views"
          value={tab}
          onChange={setTab}
          items={[
            { id: "availability", label: "Availability" },
            { id: "shelf", label: "Shelf & visibility", count: 4 },
            { id: "pricing", label: "Pricing" },
          ]}
        />
        <ChartCard
          title="Shelf share by governorate"
          soWhat="Your share trails Coca-Cola in every governorate; Basra has the widest gap at 11 pts."
          howToRead="Each row is a governorate. Violet is your portfolio, Ink the key competitor, Slate all others."
          asOf="As of 26 Sep"
          base="742 outlets"
          confidence="measured"
          actions={
            <SegmentedControl ariaLabel="Time window" value={win} onChange={setWin} size="sm"
              options={[{ value: "m", label: "Month" }, { value: "q", label: "Quarter" }, { value: "y", label: "Year" }]} />
          }
        >
          <div className="flex flex-col gap-3">
            {[["Basra", 28, 39], ["Baghdad", 34, 38], ["Erbil", 31, 33]].map(([g, a, b]) => (
              <div key={g} className="grid grid-cols-[96px_1fr] items-center gap-3 text-sm">
                <span>{g}</span>
                <span className="flex h-5 overflow-hidden rounded-sm">
                  <span style={{ width: `${a}%`, background: "var(--vm-chart-1)" }} />
                  <span style={{ width: `${b}%`, background: "var(--vm-chart-2)" }} />
                  <span className="flex-1" style={{ background: "var(--vm-chart-3)" }} />
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </Section>

      <Section title="Table">
        <Card flush title="Outlets to visit first">
          <div className="overflow-x-auto">
            <table className="vm-table">
              <thead><tr><th>Outlet</th><th>Governorate</th><th className="num">Share</th><th>Band</th><th>Confidence</th></tr></thead>
              <tbody>
                <tr><td>Al Noor Market</td><td>Basra</td><td className="num">12.0%</td><td><BandChip band="critical" size="sm" /></td><td><ConfidenceBadge level="measured" size="sm" /></td></tr>
                <tr aria-selected="true"><td>Dream City Mart</td><td>Erbil</td><td className="num">14.5%</td><td><BandChip band="attention" size="sm" /></td><td><ConfidenceBadge level="stale" size="sm" /></td></tr>
                <tr><td>Zayouna Hyper</td><td>Baghdad</td><td className="num">31.8%</td><td><BandChip band="strong" size="sm" /></td><td><ConfidenceBadge level="measured" size="sm" /></td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <Section title="Overlays and feedback">
        <Row>
          <Button variant="secondary" onClick={() => setDialog(true)}>Open dialog</Button>
          <Button variant="secondary" onClick={() => setDrawer(true)}>Open drawer</Button>
          <Button variant="secondary" onClick={() => push("Follow-up audit requested for 12 outlets.")}>Show toast</Button>
        </Row>
      </Section>

      <Section title="Empty, loading, locked">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card><EmptyState title="No visits in Basra yet" lead="Your first data arrives two weeks after activation." action={<Button variant="secondary">Change scope</Button>} /></Card>
          <Card className="flex flex-col gap-3">
            <Skeleton width={120} height={12} />
            <Skeleton width="60%" height={44} />
            <Skeleton height={6} />
            <Skeleton width="80%" height={12} />
          </Card>
          <LockedRegion title="POS Explorer" lead="Every audited outlet with its photos, bands and history, filterable and exportable." action={<Button variant="text">Request full demo</Button>} />
        </div>
      </Section>

      <Section title="Signal field (marketing only)">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-40 overflow-hidden rounded-lg border border-line bg-bg"><SignalField colorway="paper" className="h-full w-full" /></div>
          <div className="h-40 overflow-hidden rounded-lg bg-primary"><SignalField colorway="violet" className="h-full w-full" /></div>
          <div className="h-40 overflow-hidden rounded-lg bg-[color:var(--vm-text)]"><SignalField colorway="ink" className="h-full w-full" /></div>
        </div>
      </Section>

      <Section title="Icons">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8 lg:grid-cols-12">
          {ICON_NAMES.map((n) => (
            <span key={n} className="flex flex-col items-center gap-1 rounded-md border border-line bg-surface p-3 text-text" title={n}>
              <Icon name={n} />
              <span className="w-full truncate text-center font-mono text-xs text-text-muted">{n}</span>
            </span>
          ))}
        </div>
      </Section>

      <Dialog open={dialog} onClose={() => setDialog(false)} title="Request a follow-up audit" description="We revisit the outlets and re-run the rule that raised this action."
        footer={<><Button variant="secondary" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={() => setDialog(false)}>Request audit</Button></>}>
        <TextField label="Outlets" defaultValue="12 outlets in Basra" />
      </Dialog>
      <Drawer open={drawer} onClose={() => setDrawer(false)} eyebrow="POS-0148 · Basra" title="Al Noor Market" badge={<BandChip band="critical" size="sm" />}>
        <p className="text-sm text-text">Drawer body: outlet detail, shelf evidence and history.</p>
      </Drawer>
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
