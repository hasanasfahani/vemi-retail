"use client";

/* Priorities — the follow-through layer.

   Every flagged issue can become a tracked task here: an owner, a
   status, a due date. This is the piece the portal didn't have before
   Phase 9 — insights told you what was wrong, nothing tracked whether
   anyone did something about it. */

import { useState, useSyncExternalStore } from "react";
import PageHeader from "@/components/portal/PageHeader";
import { useActions } from "@/components/portal/useActions";
import { readAccessSnapshot } from "@/lib/demoAccess";
import {
  ACTION_STATUSES,
  type ActionRecord,
  type ActionStatus,
} from "@/lib/actionsShared";

const noopSubscribe = () => () => {};

const COLUMN_META: Record<
  ActionStatus,
  { label: string; hint: string; dot: string }
> = {
  Open: { label: "Open", hint: "Not started", dot: "var(--color-ink-400)" },
  "In Progress": { label: "In Progress", hint: "Being worked", dot: "var(--color-warn)" },
  Done: { label: "Done", hint: "Resolved", dot: "var(--color-good)" },
};

export default function PrioritiesView() {
  const session = useSyncExternalStore(noopSubscribe, readAccessSnapshot, () => null);
  const { actions, loading, error, refresh, create, update } = useActions();
  const [formOpen, setFormOpen] = useState(false);

  const byStatus = (status: ActionStatus) =>
    (actions ?? []).filter((a) => a.status === status);

  return (
    <>
      <PageHeader
        title="Priorities"
        lead="Every flagged issue you've decided to act on"
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          Backed by Airtable — visible to anyone with the base, not just this
          session.
        </p>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="btn-primary !py-2 text-sm"
        >
          {formOpen ? "Cancel" : "New action"}
        </button>
      </div>

      {formOpen && (
        <NewActionForm
          defaultOwner={session?.fullName ?? ""}
          onCreate={async (input) => {
            await create(input);
            setFormOpen(false);
          }}
        />
      )}

      {error && (
        <div className="mb-4 rounded-[14px] border border-line bg-white p-4">
          <p className="text-sm text-ink-700">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-2 text-[13px] font-semibold text-violet-ink hover:underline"
          >
            Retry →
          </button>
        </div>
      )}

      {loading && !actions && (
        <div className="grid gap-4 md:grid-cols-3">
          {ACTION_STATUSES.map((status) => (
            <div key={status} className="rounded-[18px] border border-line bg-white p-5">
              <div className="sk-line" style={{ width: 90, height: 14 }} />
              <div className="sk-block mt-4" style={{ height: 120 }} />
            </div>
          ))}
        </div>
      )}

      {actions && (
        <div className="grid gap-4 md:grid-cols-3">
          {ACTION_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              items={byStatus(status)}
              onUpdate={update}
            />
          ))}
        </div>
      )}
    </>
  );
}

function Column({
  status,
  items,
  onUpdate,
}: {
  status: ActionStatus;
  items: ActionRecord[];
  onUpdate: (id: string, patch: Partial<{ status: ActionStatus }>) => Promise<void>;
}) {
  const meta = COLUMN_META[status];
  return (
    <section className="rounded-[18px] border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="dot" style={{ background: meta.dot }} />
        <h2 className="t-h3 !text-[15px]">{meta.label}</h2>
        <span className="mono text-[12px] text-ink-400">{items.length}</span>
      </div>
      <p className="mt-0.5 text-[12px] text-ink-400">{meta.hint}</p>

      <div className="mt-3 flex flex-col gap-2.5">
        {items.length === 0 && (
          <p className="py-6 text-center text-[13px] text-ink-400">
            Nothing here.
          </p>
        )}
        {items.map((action) => (
          <ActionCard key={action.id} action={action} onUpdate={onUpdate} />
        ))}
      </div>
    </section>
  );
}

function ActionCard({
  action,
  onUpdate,
}: {
  action: ActionRecord;
  onUpdate: (id: string, patch: Partial<{ status: ActionStatus }>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-[12px] border border-line bg-canvas p-3">
      <p className="text-[13px] font-semibold leading-snug text-ink-900">
        {action.title}
      </p>
      {(action.where || action.rule) && (
        <p className="mt-0.5 text-[11px] text-ink-400">
          {[action.where, action.rule].filter(Boolean).join(" · ")}
        </p>
      )}
      {action.notes && (
        <p className="mt-1.5 text-[12px] leading-snug text-ink-500">
          {action.notes}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
        <span className="text-[12px] text-ink-700">
          {action.owner || <span className="text-ink-400">Unassigned</span>}
          {action.dueDate && (
            <span className="text-ink-400"> · due {action.dueDate}</span>
          )}
        </span>

        <select
          value={action.status}
          disabled={busy}
          onChange={async (e) => {
            setBusy(true);
            try {
              await onUpdate(action.id, { status: e.target.value as ActionStatus });
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-md border border-line-strong bg-white px-1.5 py-1 text-[11px] font-medium text-ink-700 outline-none focus:border-violet"
        >
          {ACTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function NewActionForm({
  defaultOwner,
  onCreate,
}: {
  defaultOwner: string;
  onCreate: (input: {
    title: string;
    owner: string;
    notes?: string;
    dueDate?: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState(defaultOwner);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !owner.trim()) {
      setFormError("Title and owner are both required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onCreate({
        title: title.trim(),
        owner: owner.trim(),
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
      });
    } catch {
      setFormError("Couldn't save that. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mb-4 grid gap-3 rounded-[14px] border border-line bg-white p-4 sm:grid-cols-2"
    >
      <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-700 sm:col-span-2">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Visit ERB-1002 — replenish the empty SKU"
          className="rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13px] text-ink-900 outline-none focus:border-violet"
        />
      </label>
      <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-700">
        Owner
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Who's doing this"
          className="rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13px] text-ink-900 outline-none focus:border-violet"
        />
      </label>
      <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-700">
        Due date
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13px] text-ink-900 outline-none focus:border-violet"
        />
      </label>
      <label className="flex flex-col gap-1 text-[12px] font-medium text-ink-700 sm:col-span-2">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[13px] text-ink-900 outline-none focus:border-violet"
        />
      </label>

      {formError && (
        <p className="text-[12px] font-medium sm:col-span-2" style={{ color: "var(--color-critical)" }}>
          {formError}
        </p>
      )}

      <div className="sm:col-span-2">
        <button type="submit" disabled={saving} className="btn-primary !py-2 text-sm">
          {saving ? "Saving…" : "Add to Priorities"}
        </button>
      </div>
    </form>
  );
}
