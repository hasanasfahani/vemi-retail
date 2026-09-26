"use client";

/* The right-hand slide-over (brand Drawer). Detail without losing your
   place: the filtered list stays behind it, Escape and the scrim close
   it, focus moves in, stays in, and returns to what opened it. */

import type { ReactNode } from "react";
import { Drawer as VmDrawer } from "@/components/vemi/Drawer";

export default function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  subtitle,
  badge,
  footer,
  width = 520,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  width?: number;
  children: ReactNode;
}) {
  return (
    <VmDrawer open={open} onClose={onClose} title={title} eyebrow={eyebrow} subtitle={subtitle} badge={badge} footer={footer} width={width}>
      {children}
    </VmDrawer>
  );
}
