"use client";

/* Section tabs within a page — Performance's five views, POS Explorer's
   map/list switch. Real buttons in a tablist, arrow-key navigable,
   with the active tab underlined rather than boxed so the strip reads
   as one control instead of five chips. */

export type Tab = { id: string; label: string; count?: number };

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(tab.id)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-[13px] transition-colors ${
              on
                ? "border-violet font-semibold text-ink-900"
                : "border-transparent font-medium text-ink-500 hover:text-ink-700"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="mono ml-1.5 text-[11px] text-ink-400">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
