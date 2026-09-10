/* ============================================================
   ONE PLACE CONFIRMATIONS GO.

   The Watch control appears on KPI tiles, brand cards, governorate
   cards, chart rows and table rows — dozens of them on a page. Each
   holding its own toast state would mean each rendering its own toast
   host, and a page with thirty hosts stacks thirty overlapping
   confirmations in the same corner.

   So the message is pushed onto a module-level channel and ONE host,
   mounted by the page shell, renders it.
   ============================================================ */

export type BusToast = { id: number; kind: "success" | "info"; text: string };

let toasts: BusToast[] = [];
let seq = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): BusToast[] {
  return toasts;
}

export function pushToast(text: string, kind: BusToast["kind"] = "success"): void {
  seq += 1;
  const id = seq;
  toasts = [...toasts, { id, kind, text }];
  emit();
  window.setTimeout(() => dismissToast(id), 4200);
}

export function dismissToast(id: number): void {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}
