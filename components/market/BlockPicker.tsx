"use client";

/* The block catalogue, as a drawer.

   CLICK APPENDS, AND THE DRAWER STAYS OPEN. The brief had the reader
   drag a chart onto the page; dragging is the more expensive thing to
   build, the slower thing to use and unusable from a keyboard. It is
   also solving the wrong problem — when ADDING, nobody has an opinion
   about position yet. Dragging earns its keep when reordering, which is
   where it lives. Staying open means four blocks is four clicks rather
   than four round trips. */

import { useMemo, useState } from "react";
import Drawer from "./ui/Drawer";
import {
  BLOCKS, BLOCK_GROUPS, BLOCK_GROUP_LABEL, blocksInGroup, type BlockDef,
} from "@/lib/market/reportBlocks";

export default function BlockPicker({
  open,
  onClose,
  onAdd,
  counts,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (block: BlockDef) => void;
  /* How many times each block is already on the report. Shown, not
     used to disable: the same chart at two scopes side by side is a
     legitimate report and the commonest reason to want per-block
     scope at all. */
  counts: Record<string, number>;
}) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BLOCK_GROUPS.map((group) => ({
      group,
      blocks: blocksInGroup(group).filter(
        (block) =>
          !q ||
          block.label.toLowerCase().includes(q) ||
          block.description.toLowerCase().includes(q)
      ),
    })).filter((row) => row.blocks.length > 0);
  }, [query]);

  if (!open) return null;

  return (
    <Drawer
      open
      onClose={onClose}
      width={420}
      title="Add a block"
      subtitle={`${BLOCKS.length} to choose from — click to add, keep clicking to add more`}
    >
      <div className="flex flex-col gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a block…"
          className="w-full rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-violet"
        />

        {groups.length === 0 && (
          <p className="text-[12.5px] text-ink-500">Nothing matches “{query}”.</p>
        )}

        {groups.map(({ group, blocks }) => (
          <section key={group}>
            <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
              {BLOCK_GROUP_LABEL[group]}
            </h3>
            <ul className="flex flex-col gap-1">
              {blocks.map((block) => (
                <li key={block.id}>
                  <button
                    type="button"
                    onClick={() => onAdd(block)}
                    className="flex w-full items-start gap-2 rounded-[10px] border border-line bg-white px-2.5 py-2 text-left transition-colors hover:border-violet hover:bg-violet-050"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold text-ink-900">
                        {block.label}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-500">
                        {block.description}
                      </span>
                    </span>
                    {counts[block.id] > 0 && (
                      <span className="mono shrink-0 rounded-full bg-canvas px-1.5 py-[1px] text-[10.5px] text-ink-500">
                        ×{counts[block.id]}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Drawer>
  );
}
