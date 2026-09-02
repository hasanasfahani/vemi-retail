import Link from "next/link";
import PageHeader from "@/components/portal/PageHeader";

export const metadata = {
  title: "Visibility & POSM",
};

/* Deliberately not populated: the field checklist captures POSM as
   optional, so there is no honest basis for numbers here yet. It ships
   as a locked module rather than invented data. */
export default function VisibilityPage() {
  return (
    <>
      <PageHeader
        title="Visibility & POSM"
        lead="Display compliance, coolers and point-of-sale material"
      />

      <div className="card max-w-xl !p-6">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
            <path d="M5.75 7V5.25a2.25 2.25 0 0 1 4.5 0V7" />
          </svg>
          <span className="t-h3">Not included in this plan</span>
        </div>
        <p className="mt-2 text-sm text-ink-500">
          Visibility auditing tracks cooler placement, planogram compliance,
          branded POSM and secondary displays across your outlets. It is
          collected as a dedicated field module.
        </p>
        <Link href="/#packages" className="btn-primary mt-5 !py-2 text-sm">
          Add visibility auditing
        </Link>
      </div>
    </>
  );
}
