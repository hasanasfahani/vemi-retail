"use client";

import { MotionConfig, motion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
};

/* A short rise as a section enters (brand motion: small distance, quick,
   eased out). Under reduced motion framer drops the movement and keeps
   only the fade; the markup is identical either way, so hydration holds. */
export default function Reveal({
  children,
  delay = 0,
  className,
}: RevealProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
