import type { CSSProperties } from "react";
import { cx } from "./cx";

/** A Violet 100 block the size of the content it stands in for. */
export function Skeleton({
  width = "100%", height = 16, radius, className,
}: { width?: CSSProperties["width"]; height?: CSSProperties["height"]; radius?: number; className?: string }) {
  return <span aria-hidden="true" className={cx("vm-skel", className)} style={{ width, height, ...(radius ? { borderRadius: radius } : null) }} />;
}
