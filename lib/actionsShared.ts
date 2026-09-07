/* ============================================================
   Actions — shared shape between the API routes and the client.

   Pure and secret-free, so it's safe in both a server route handler
   and a "use client" component. The Airtable field names live here
   once, so a route handler and the mapper below can't drift apart.
   ============================================================ */

export const ACTIONS_FIELD = {
  title: "Title",
  insightId: "Insight ID",
  rule: "Rule",
  where: "Where",
  owner: "Owner",
  status: "Status",
  dueDate: "Due Date",
  notes: "Notes",
  items: "Items",
  progress: "Progress",
} as const;

/* One stop in a piece of work — an outlet to visit, a district to
   route through, a retailer to call. Actions that are genuinely a
   single conversation (a fixture negotiation) carry none, and the UI
   must stay correct when the list is empty. */
export type ActionItem = {
  id: string;
  label: string;
  where?: string;
  done: boolean;
};

export type ActionStatus = "Open" | "In Progress" | "Done";
export const ACTION_STATUSES: ActionStatus[] = ["Open", "In Progress", "Done"];

export type ActionRecord = {
  id: string;
  title: string;
  insightId?: string;
  rule?: string;
  where?: string;
  owner: string;
  status: ActionStatus;
  dueDate?: string;
  notes?: string;
  items: ActionItem[];
  /* Airtable's own createdTime — no "Created" field write needed,
     every record carries this metadata regardless of its fields. */
  createdAt: string;
};

type RawAirtableRecord = {
  id: string;
  createdTime: string;
  fields?: Record<string, unknown>;
};

/* Blank starter rows ship with every new Airtable table — anything
   with no title is one of those, not a real action, and is dropped
   at the source rather than asking the reader to ignore them. */
export function hasTitle(record: RawAirtableRecord): boolean {
  return typeof record.fields?.[ACTIONS_FIELD.title] === "string" &&
    (record.fields[ACTIONS_FIELD.title] as string).trim().length > 0;
}

export function toAction(record: RawAirtableRecord): ActionRecord {
  const f = record.fields ?? {};
  const status = f[ACTIONS_FIELD.status];
  return {
    id: record.id,
    title: (f[ACTIONS_FIELD.title] as string) ?? "",
    insightId: (f[ACTIONS_FIELD.insightId] as string) || undefined,
    rule: (f[ACTIONS_FIELD.rule] as string) || undefined,
    where: (f[ACTIONS_FIELD.where] as string) || undefined,
    owner: (f[ACTIONS_FIELD.owner] as string) ?? "",
    status: ACTION_STATUSES.includes(status as ActionStatus)
      ? (status as ActionStatus)
      : "Open",
    dueDate: (f[ACTIONS_FIELD.dueDate] as string) || undefined,
    notes: (f[ACTIONS_FIELD.notes] as string) || undefined,
    items: parseItems(f[ACTIONS_FIELD.items]),
    createdAt: record.createdTime,
  };
}

/* ---------- line items ----------

   Items live as JSON in one long-text field. That is a deliberate
   trade: one field to add, and every change to a checklist is a single
   atomic write rather than a create-parent-then-create-children dance
   that can half-succeed — which matters because this queue is
   fail-loud by design. The cost is that the raw field is opaque inside
   Airtable, which the sibling `Progress` string exists to offset.

   Parsing is defensive on purpose: this field is hand-editable in
   Airtable, so malformed content is a question of when, not if. Bad
   JSON degrades to "no items", which renders as today's plain card,
   rather than taking the Priorities page down. */
export function parseItems(raw: unknown): ActionItem[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i): i is Record<string, unknown> =>
          !!i && typeof i === "object" && typeof i.label === "string"
      )
      .map((i, index) => ({
        id: typeof i.id === "string" ? i.id : `item-${index}`,
        label: i.label as string,
        where: typeof i.where === "string" ? i.where : undefined,
        done: i.done === true,
      }));
  } catch {
    return [];
  }
}

export function serialiseItems(items: ActionItem[]): string {
  return items.length ? JSON.stringify(items) : "";
}

/* The human-readable sibling of the JSON — so anyone working in the
   base sees where an action stands without parsing anything. */
export function progressOf(items: ActionItem[]): string {
  if (!items.length) return "";
  return `${items.filter((i) => i.done).length}/${items.length}`;
}
