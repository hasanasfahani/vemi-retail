import { scope } from "@/lib/portal";

export default function PageHeader({
  title,
  lead,
  posCount,
}: {
  title: string;
  lead: string;
  /* Reflects the current filter selection when one is applied. */
  posCount?: number;
}) {
  const count = posCount ?? scope.posCount;
  return (
    <div className="mb-6">
      <h1 className="t-h3 !text-2xl">{title}</h1>
      <p className="mt-1 text-sm text-ink-500">
        {lead} · {scope.city}, {scope.country} · {count} outlet
        {count === 1 ? "" : "s"}
      </p>
    </div>
  );
}
