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
} as const;

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
    createdAt: record.createdTime,
  };
}
