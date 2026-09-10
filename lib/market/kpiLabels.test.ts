/* One name per measure. These tests exist because there were five
   maps and three of them disagreed — the Watch control on a KPI tile
   said "Shelf & visibility" while the tile it sat on said "Shelf
   share", and neither was wrong, they were just two places that had
   each written down a reasonable name. */

import { describe, expect, it } from "vitest";
import { KPI_HINT, KPI_NAME } from "./kpiLabels";
import { KPI_LABEL } from "./issues";
import { TARGET_META } from "./settings";
import { WATCH_KPI_LABEL } from "./watchlist";

const IDS = ["availability", "shelfShare", "assortment", "price", "posm"] as const;

describe("every surface names a measure the same way", () => {
  it("agrees between the follow-up queue and the one map", () => {
    for (const id of IDS) expect(KPI_LABEL[id], id).toBe(KPI_NAME[id]);
  });

  it("agrees between the Watch control and the one map", () => {
    /* This is the pairing the user actually saw disagree, on a KPI
       tile where the control sits beside the label. */
    for (const id of [...IDS, "score"] as const) {
      expect(WATCH_KPI_LABEL[id], id).toBe(KPI_NAME[id]);
    }
  });

  it("agrees between the Setup page's targets and the one map", () => {
    for (const row of TARGET_META) expect(row.label, row.id).toBe(KPI_NAME[row.id]);
  });

  it("gives every measure a name and a hint", () => {
    for (const id of [...IDS, "score"] as const) {
      expect(KPI_NAME[id], id).toBeTruthy();
      expect(KPI_HINT[id], id).toBeTruthy();
    }
  });

  it("never gives two measures the same name", () => {
    const names = Object.values(KPI_NAME);
    expect(new Set(names).size).toBe(names.length);
  });
});
