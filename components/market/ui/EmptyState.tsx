/* What a filtered view says when it selects nothing: what is missing,
   why (usually a filter narrower than the month's coverage, not an empty
   shelf), and the way out. No illustration. */

import type { ReactNode } from "react";
import { EmptyState as VmEmpty } from "@/components/vemi/EmptyState";

export default function EmptyState({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return <VmEmpty title={title} lead={lead} action={action} />;
}
