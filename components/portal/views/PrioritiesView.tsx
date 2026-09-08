"use client";

/* Priorities — the follow-through layer.

   Every flagged issue can become a tracked task here: an owner, a
   status, a due date. This is the piece the portal didn't have before
   Phase 9 — insights told you what was wrong, nothing tracked whether
   anyone did something about it. */

import { useState, useSyncExternalStore } from "react";
import PageHeader from "@/components/portal/PageHeader";
import { useActions } from "@/components/portal/useActions";
import { useVerification } from "@/components/portal/useVerification";
import { formatImpact } from "@/lib/economics";
import {
  OUTCOME_LABEL,
  OUTCOME_TONE,
  describeOutcome,
  type ConfirmationSummary,
  type Verification,
} from "@/lib/verification";
import { readAccessSnapshot } from "@/lib/demoAccess";
import {
  ACTION_STATUSES,
  type ActionRecord,
  type ActionStatus,
} from "@/lib/actionsShared";

const noopSubscribe = () => () => {};

/* What a card can change: its status, or one line item at a time. */
type UpdatePatch = Partial<{
  status: ActionStatus;
  toggleItem: { id: string; done: boolean };
}>;

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

  /* What the SHELF did, alongside what the person did. Derived from
     the engine rather than stored, so it cannot drift out of step with
     the findings it grades. */
  const { verifications, summary } = useVerification(actions);

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
              verifications={verifications}
              summary={status === "Done" ? summary : null}
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
  verifications,
  summary,
}: {
  status: ActionStatus;
  items: ActionRecord[];
  onUpdate: (id: string, patch: UpdatePatch) => Promise<void>;
  verifications: Map<string, Verification>;
  summary: ConfirmationSummary | null;
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

      {/* THE COLUMN THIS FEATURE EXISTS FOR.

          "Done" used to be a count of claims. It now leads with what
          the shelf said about them — and with the one number that
          cannot be raised by closing more work, only by the shelf
          changing. */}
      {summary && summary.closed > 0 && (
        <div className="mt-2.5 rounded-[10px] bg-canvas px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">
              Confirmed on shelf
            </span>
            <span className="mono text-[15px] font-bold text-ink-900">
              {summary.confirmationRate === null
                ? "—"
                : `${summary.confirmationRate}%`}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-ink-500">
            {summary.confirmationRate === null ? (
              <>
                Nothing re-audited yet. A rate here would say the work
                failed; it has not been checked.
              </>
            ) : (
              <>
                {summary.held} confirmed
                {summary.partial > 0 && `, ${summary.partial} partly fixed`}
                {summary.slipped > 0 && `, ${summary.slipped} still open`} of{" "}
                {summary.checkable} we could check.
                {summary.recovered > 0 && (
                  <>
                    {" "}
                    <span className="font-semibold text-ink-700">
                      {formatImpact(summary.recovered)}
                    </span>{" "}
                    back on shelf.
                  </>
                )}
              </>
            )}
          </p>
          {(summary.awaiting > 0 || summary.unverifiable > 0) && (
            <p className="mt-1 text-[11.5px] text-ink-400">
              {summary.awaiting > 0 && `${summary.awaiting} awaiting re-audit`}
              {summary.awaiting > 0 && summary.unverifiable > 0 && " · "}
              {summary.unverifiable > 0 &&
                `${summary.unverifiable} not re-audited in two windows`}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2.5">
        {items.length === 0 && (
          <p className="py-6 text-center text-[13px] text-ink-400">
            Nothing here.
          </p>
        )}
        {items.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onUpdate={onUpdate}
            verification={verifications.get(action.id) ?? null}
          />
        ))}
      </div>
    </section>
  );
}

function OutcomeBand({ verification }: { verification: Verification }) {
  const tone = OUTCOME_TONE[verification.outcome];
  const colour =
    tone === "good"
      ? "var(--color-good)"
      : tone === "warn"
        ? "var(--color-warn)"
        : tone === "critical"
          ? "var(--color-critical)"
          : "var(--color-ink-400)";

  return (
    <div className="mt-2 rounded-[8px] border border-line bg-white px-2.5 py-2">
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
          style={{ background: colour }}
          aria-hidden
        />
        <span className="text-[12px] font-semibold" style={{ color: colour }}>
          {OUTCOME_LABEL[verification.outcome]}
        </span>
      </span>
      <p className="mt-1 text-[11.5px] leading-snug text-ink-500">
        {describeOutcome(verification)}
      </p>
    </div>
  );
}

function ActionCard({
  action,
  onUpdate,
  verification,
}: {
  action: ActionRecord;
  onUpdate: (id: string, patch: UpdatePatch) => Promise<void>;
  verification: Verification | null;
}) {
  const [busy, setBusy] = useState(false);
  const [ticking, setTicking] = useState<string | null>(null);
  const [tickError, setTickError] = useState<string | null>(null);
  const [openList, setOpenList] = useState(false);

  const items = action.items;
  const doneCount = items.filter((i) => i.done).length;
  const allDone = items.length > 0 && doneCount === items.length;

  const toggle = async (id: string, done: boolean) => {
    setTicking(id);
    setTickError(null);
    try {
      await onUpdate(action.id, { toggleItem: { id, done } });
    } catch {
      /* Fail loud, same as every other write in this queue — a tick
         that silently didn't save is worse than one that says so. */
      setTickError("That didn't save. Try again.");
    } finally {
      setTicking(null);
    }
  };

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

      {/* What the shelf said. Deliberately below the title and above
          everything else: on a closed card this is the most important
          line, and it is the only one the person who closed it did not
          write themselves. */}
      {verification && <OutcomeBand verification={verification} />}
      {action.notes && (
        <p className="mt-1.5 text-[12px] leading-snug text-ink-500">
          {action.notes}
        </p>
      )}

      {/* Progress reads on the collapsed card: a segmented meter and a
          count, the same form the range chart uses, so the vocabulary
          is one the reader has already met. Actions with no items —
          a fixture negotiation is genuinely one conversation — keep
          exactly the card they had before. */}
      {items.length > 0 && (
        <div className="mt-2.5">
          <div className="flex gap-[2px]">
            {items.map((i) => (
              <span
                key={i.id}
                className="h-[7px] flex-1 rounded-[2px]"
                style={{
                  background: i.done
                    ? "var(--color-violet)"
                    : "var(--color-line)",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpenList((v) => !v)}
            aria-expanded={openList}
            className="mt-1.5 text-[11.5px] font-medium text-ink-500 hover:text-ink-900"
          >
            {doneCount} of {items.length} done
            <span className="ml-1 text-ink-400">
              {openList ? "· hide" : "· check them off"}
            </span>
          </button>

          {openList && (
            <div className="mt-1.5 overflow-hidden rounded-[9px] border border-line bg-white">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-2 border-b border-line px-2.5 py-1.5 text-[12px] last:border-0 hover:bg-canvas"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    disabled={ticking === item.id}
                    onChange={(e) => toggle(item.id, e.target.checked)}
                    className="h-[13px] w-[13px] accent-[var(--color-violet)]"
                  />
                  <span
                    className={
                      item.done
                        ? "text-ink-400 line-through"
                        : "font-semibold text-ink-900"
                    }
                  >
                    {item.label}
                  </span>
                  {item.where && (
                    <span className="truncate text-ink-400">· {item.where}</span>
                  )}
                </label>
              ))}
            </div>
          )}

          {tickError && (
            <p
              className="mt-1 text-[11.5px] font-medium"
              style={{ color: "var(--color-critical)" }}
            >
              {tickError}
            </p>
          )}

          {/* The last tick offers to close the action; it never changes
              the status by itself. A status that moves on its own is one
              the owner stops trusting. */}
          {allDone && action.status !== "Done" && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onUpdate(action.id, { status: "Done" });
                } finally {
                  setBusy(false);
                }
              }}
              className="mt-2 w-full rounded-[8px] bg-violet px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-violet-ink"
            >
              All {items.length} done — mark this action complete?
            </button>
          )}
        </div>
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
