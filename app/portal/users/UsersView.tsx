"use client";

/* PAGE 11 · Users & Settings.

   Two lists and a set of switches. The users are the same people the
   Action Center assigns work to — one list of who exists, so a name on
   a card and a name in this table cannot drift apart — and each row
   states how many open actions that person is actually carrying,
   because a users page that cannot answer "who is busy?" is a
   directory rather than a settings page.

   The auditors are separate and come from the audit data itself: they
   are Vemi's field team, not the client's staff, and conflating the
   two would misrepresent who works for whom. */

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/market/PageShell";
import { Card, DataTable, StatCard, Toasts, useToasts, type Column } from "@/components/market/ui";
import Badge from "@/components/market/ui/Badge";
import { useActions } from "@/components/market/useActions";
import {
  DEFAULT_NOTIFICATIONS, NOTIFICATIONS, USERS, loadNotifications, saveNotifications,
  type NotificationId, type User,
} from "@/lib/market/settings";
import { auditors, cities, contract } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";

export default function UsersView() {
  return <PageShell>{(view) => <Users view={view} />}</PageShell>;
}

function Users({ view }: { view: MarketView }) {
  const board = useActions();
  const { toasts, push, dismiss } = useToasts();
  const [notifications, setNotifications] =
    useState<Record<NotificationId, boolean>>(DEFAULT_NOTIFICATIONS);

  /* Read after mount, for the same hydration reason as everything else
     stored in this browser. */
  useEffect(() => {
    let live = true;
    (async () => {
      const held = loadNotifications();
      if (live) setNotifications(held);
    })();
    return () => {
      live = false;
    };
  }, []);

  const toggle = (id: NotificationId) => {
    const next = { ...notifications, [id]: !notifications[id] };
    setNotifications(next);
    saveNotifications(next);
    const meta = NOTIFICATIONS.find((n) => n.id === id)!;
    push(`${meta.label} ${next[id] ? "on" : "off"}.`, "info");
  };

  /* Open work per person, read straight off the board. */
  const load = useMemo(() => {
    const counts = new Map<string, { open: number; critical: number }>();
    for (const action of board.actions ?? []) {
      if (action.stage === "resolved" || action.stage === "verified") continue;
      const held = counts.get(action.owner) ?? { open: 0, critical: 0 };
      held.open += 1;
      if (action.priority === "high") held.critical += 1;
      counts.set(action.owner, held);
    }
    return counts;
  }, [board.actions]);

  const columns: Column<User>[] = [
    {
      id: "name",
      header: "Name",
      sortValue: (u) => u.name,
      render: (u) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-050 text-[11px] font-semibold text-violet-ink">
            {u.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink-900">{u.name}</span>
            <span className="mono block truncate text-[11px] text-ink-400">{u.owns}</span>
          </span>
        </div>
      ),
      csv: (u) => u.name,
    },
    { id: "role", header: "Role", sortValue: (u) => u.role, render: (u) => u.role },
    {
      id: "access",
      header: "Access",
      sortValue: (u) => u.access,
      render: (u) => (
        <Badge
          band={u.access === "Full access" ? "strong" : u.access === "Read & act" ? "average" : "attention"}
          label={u.access}
          size="sm"
        />
      ),
    },
    {
      id: "open",
      header: "Open actions",
      align: "right",
      sortValue: (u) => load.get(u.role)?.open ?? 0,
      csv: (u) => load.get(u.role)?.open ?? 0,
      render: (u) => {
        const held = load.get(u.role);
        if (!held) return <span className="text-[11.5px] text-ink-400">None</span>;
        return (
          <span className="mono text-ink-900">
            {held.open}
            {held.critical > 0 && (
              <span className="ml-1.5 text-[11px] text-[color:var(--color-critical)]">
                {held.critical} critical
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      sortValue: (u) => u.status,
      render: (u) => (
        <Badge band={u.status === "Active" ? "strong" : "average"} label={u.status} size="sm" />
      ),
    },
  ];

  const on = Object.values(notifications).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Client users" value={USERS.length} footnote="People with access to this workspace" />
        <StatCard label="Field auditors" value={auditors.length} footnote={`Covering ${cities.length} cities on this contract`} />
        <StatCard
          label="Open actions"
          value={[...load.values()].reduce((s, v) => s + v.open, 0)}
          footnote="Across every owner"
        />
        <StatCard label="Alerts on" value={`${on} of ${NOTIFICATIONS.length}`} footnote="Notification types enabled in this browser" />
      </div>

      <Card
        title="Users"
        lead="Everyone with access to the Pepsi Iraq workspace, and what each is carrying."
        padded={false}
        footnote="Ownership on the Action Center points at this list, so a name on a card and a name here cannot drift apart."
      >
        <DataTable
          rows={USERS}
          columns={columns}
          rowKey={(u) => u.id}
          defaultSort={{ id: "open", dir: "desc" }}
          exportName="workspace-users"
          pageSize={10}
        />
      </Card>

      <Card
        title="Notifications"
        lead="What this workspace sends, and when."
        footnote="Preferences are stored in this browser only — there is no mail server behind them in this build, and the toggles say so rather than implying delivery."
      >
        <ul className="flex flex-col">
          {NOTIFICATIONS.map((item) => (
            <li key={item.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-ink-900">{item.label}</p>
                <p className="text-[11.5px] leading-snug text-ink-400">{item.hint}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications[item.id]}
                onClick={() => toggle(item.id)}
                className={`relative h-[22px] w-[40px] shrink-0 rounded-full transition-colors ${
                  notifications[item.id] ? "bg-violet" : "bg-line-strong"
                }`}
              >
                <span className="sr-only">{item.label}</span>
                <span
                  className="absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-all"
                  style={{ left: notifications[item.id] ? 21 : 3 }}
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Field team"
        lead={`Vemi auditors covering ${contract.client}. They work for Vemi, not the client, and are listed separately for that reason.`}
      >
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {auditors.map((auditor) => {
            const covered = view.outlets.filter(
              (o) => view.auditedBy.get(o.id) === auditor.id
            ).length;
            return (
              <li key={auditor.id} className="rounded-[10px] border border-line px-3 py-2.5">
                <p className="text-[12.5px] font-semibold text-ink-900">{auditor.name}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-500">
                  {auditor.cities.map((c) => cities.find((x) => x.id === c)?.name ?? c).join(" · ")}
                </p>
                <p className="mono mt-1 text-[11px] text-ink-400">
                  {covered.toLocaleString()} visits this cycle
                </p>
              </li>
            );
          })}
        </ul>
      </Card>

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
