"use client";

/* PAGE 11 · Users & Settings.

   Two lists and a set of switches. The users are the same people the
   workspace knows. Follow-up requests are not assigned to a person —
   a request is the company asking Vemi to go back, not a task someone
   owns — so this page lists who has access and what each role covers,
   and does not invent an assignee.

   The auditors are separate and come from the audit data itself: they
   are Vemi's field team, not the client's staff, and conflating the
   two would misrepresent who works for whom. */

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/market/PageShell";
import { Card, DataTable, StatCard, Toasts, useToasts, type Column } from "@/components/market/ui";
import { PageHeader } from "@/components/vemi/PageHeader";
import { useFollowUps } from "@/components/market/useFollowUps";
import {
  DEFAULT_NOTIFICATIONS, NOTIFICATIONS, USERS, loadNotifications, saveNotifications,
  type NotificationId, type User,
} from "@/lib/market/settings";
import { auditors, governorates, contract } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";

export default function UsersView() {
  return <PageShell>{(view) => <Users view={view} />}</PageShell>;
}

function Users({ view }: { view: MarketView }) {
  const queue = useFollowUps();
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

  /* Follow-up requests live in flight. They are not assigned to a
     person — a request is the company asking Vemi to go back, not a
     task somebody owns — so this counts the queue rather than
     apportioning it. The Kanban that used to hand every finding an
     owner and a due date is gone, and inventing an assignee here would
     bring it back through the side door. */
  const live = useMemo(
    () => (queue.requests ?? []).filter((r) => !r.cancelled),
    [queue.requests]
  );

  const columns: Column<User>[] = [
    {
      id: "name",
      header: "Name",
      sortValue: (u) => u.name,
      render: (u) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-semibold text-violet-ink">
            {u.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink-900">{u.name}</span>
            <span className="mono block truncate text-xs text-ink-400">{u.owns}</span>
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
      /* A permission level is a role, not a health band: neutral tags,
         filled for the widest access. */
      render: (u) => <Tag filled={u.access === "Full access"}>{u.access}</Tag>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (u) => u.status,
      render: (u) => <Tag filled={u.status === "Active"}>{u.status}</Tag>,
    },
  ];

  const on = Object.values(notifications).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`${contract.country} · ${contract.category} · Users & settings`}
        title={`${USERS.length} people use this workspace, with ${on} of ${NOTIFICATIONS.length} alerts switched on.`}
        description="Who can see what, and what the workspace tells them. Field auditors work for Vemi and are listed separately."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Client users" value={USERS.length} footnote="People with access to this workspace" />
        <StatCard label="Field auditors" value={auditors.length} footnote={`Covering ${governorates.length} governorates on this contract`} />
        <StatCard
          label="Follow-up requests"
          value={live.length}
          footnote="Raised and not cancelled, across the workspace"
        />
        <StatCard label="Alerts on" value={`${on} of ${NOTIFICATIONS.length}`} footnote="Notification types enabled in this browser" />
      </div>

      <Card
        title="Users"
        lead="Everyone with access to the Pepsi Iraq workspace, and what each is carrying."
        padded={false}
        footnote="The one list of people this workspace knows. Follow-up requests are raised by the company rather than assigned to an individual, so nothing here carries a task queue."
      >
        <DataTable
          rows={USERS}
          columns={columns}
          rowKey={(u) => u.id}
          defaultSort={{ id: "name", dir: "asc" }}
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
            <li key={item.id} className="flex items-center gap-4 border-b border-line py-4 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-ink-900">{item.label}</p>
                <p className="text-sm text-ink-500">{item.hint}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications[item.id]}
                onClick={() => toggle(item.id)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors after:absolute after:-inset-2.5 after:content-[''] ${
                  notifications[item.id] ? "bg-primary" : "bg-line-strong"
                }`}
              >
                <span className="sr-only">{item.label}</span>
                <span
                  className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[var(--vm-shadow-raised)] transition-all"
                  style={{ left: notifications[item.id] ? 23 : 3 }}
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
              <li key={auditor.id} className="rounded-md border border-line px-3 py-2.5">
                <p className="text-sm font-semibold text-ink-900">{auditor.name}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {auditor.governorates.map((c) => governorates.find((x) => x.id === c)?.name ?? c).join(" · ")}
                </p>
                <p className="mono mt-1 text-xs text-ink-400">
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

function Tag({ filled, children }: { filled?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] ${
        filled ? "bg-primary-tint text-primary-text" : "border border-line-strong text-ink-900"
      }`}
    >
      {children}
    </span>
  );
}
