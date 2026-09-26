"use client";

/* Section tabs within a page — the brand Tabs: 44px, 15/600, a 2px
   Violet underline on the active tab, arrow-key navigation. */

import { Tabs as VmTabs } from "@/components/vemi/Tabs";

export type Tab = { id: string; label: string; count?: number };

export default function Tabs({
  tabs,
  active,
  onChange,
  label = "Sections",
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  return <VmTabs items={tabs} value={active} onChange={onChange} ariaLabel={label} />;
}
