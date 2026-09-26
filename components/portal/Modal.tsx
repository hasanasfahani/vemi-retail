"use client";

import { Dialog } from "@/components/vemi/Dialog";

/* Shared dialog shell for the portal's two conversion modals, on the
   brand Dialog: Escape and the scrim close it, the page behind does not
   scroll, focus moves in, stays in, and returns to what opened it. The
   body draws its own heading, named by `labelledBy`. */

export default function Modal({
  open,
  onClose,
  labelledBy,
  children,
  width = "max-w-4xl",
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy={labelledBy} width={null} className={`${width} overflow-hidden`}>
      {children}
    </Dialog>
  );
}
