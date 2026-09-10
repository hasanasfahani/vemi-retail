/* The filter vocabulary, in one place.

   The global header and a report block's own scope editor must offer
   the same options and the same names, or a block would be scoped in a
   vocabulary the bar above it does not use. */

import { brands, channels, governorateName, governorates, channelName, retailers, skus, brandName, skuName } from "./index";
import type { FilterKey } from "./filters";

export const FILTER_OPTIONS: Record<FilterKey, { value: string; label: string }[]> = {
  governorates: governorates.map((c) => ({ value: c.id, label: c.name })),
  channels: channels.map((c) => ({ value: c.id, label: c.name })),
  retailers: retailers.map((r) => ({ value: r, label: r })),
  brands: brands.map((b) => ({ value: b.id, label: b.name })),
  skus: skus.map((s) => ({ value: s.id, label: s.name })),
};

export const FILTER_VALUE_LABEL: Record<FilterKey, (v: string) => string> = {
  governorates: governorateName,
  channels: channelName,
  retailers: (v) => v,
  brands: brandName,
  skus: skuName,
};
