"use client";

/* Counts a headline figure up on first render.

   Takes the finished display string and animates only the numeric run
   inside it, so "87.8%", "#3", "1,380" and "Leading" all pass through
   correctly — the last one unchanged, because there is nothing to
   count. Honours prefers-reduced-motion by settling immediately.

   Note the dependency list: it holds primitives only. Depending on the
   parsed match array restarts the animation on every frame, because
   each render produces a new array — the figure then never leaves 0. */

import { useEffect, useRef, useState } from "react";

const PARTS = /^(\D*?)([\d,]+(?:\.\d+)?)([\s\S]*)$/;

type Parsed = {
  target: number;
  decimals: number;
  prefix: string;
  suffix: string;
} | null;

function parse(text: string): Parsed {
  const match = text.match(PARTS);
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  return {
    target: Number(digits.replace(/,/g, "")),
    decimals: digits.includes(".") ? digits.split(".")[1].length : 0,
    prefix,
    suffix,
  };
}

function formatted(value: number, p: NonNullable<Parsed>) {
  return `${p.prefix}${value.toLocaleString(undefined, {
    minimumFractionDigits: p.decimals,
    maximumFractionDigits: p.decimals,
  })}${p.suffix}`;
}

export default function CountUp({
  text,
  duration = 900,
}: {
  text: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(() => {
    const parsed = parse(text);
    return parsed ? formatted(0, parsed) : text;
  });
  const animatedOnce = useRef(false);

  useEffect(() => {
    const parsed = parse(text);

    let raf = 0;
    const settle = () => setDisplay(text);

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /* Count up on first render only. Once a figure is on screen, a
       later change comes from the reader moving a filter — re-running
       the flourish every time would be noise, and skipping the update
       would leave a stale number on screen.

       A hidden tab also pauses requestAnimationFrame, which would
       otherwise freeze the figure at zero for anyone opening the link
       in the background. Timers still run, so settle and move on. */
    if (!parsed || animatedOnce.current || reduced || document.hidden) {
      const timer = window.setTimeout(settle, 0);
      return () => window.clearTimeout(timer);
    }
    animatedOnce.current = true;

    const started = performance.now();

    /* setState lives in the frame callback, not the effect body —
       this is a subscription to the browser's clock. */
    const tick = (now: number) => {
      const t = Math.min((now - started) / duration, 1);
      // ease-out cubic: quick off the mark, settles onto the real value
      const eased = 1 - Math.pow(1 - t, 3);
      if (t < 1) {
        setDisplay(formatted(parsed.target * eased, parsed));
        raf = requestAnimationFrame(tick);
      } else {
        settle();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);

  return <>{display}</>;
}
