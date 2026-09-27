@AGENTS.md

## Brand & UI (Vemi)

This repo builds Vemi, a market intelligence platform. All UI, on the website and in the portal, follows the Vemi brand v1.0 ("The Insight V").

- Before writing or changing any UI, read `.claude/skills/vemi-brand/SKILL.md`; `docs/BRAND-REFRESH-PLAN.md` records the approved decisions (D1–D7) and deliberate deviations.
- Colors, fonts, radii and shadows come ONLY from `brand/` (`var(--vm-*)` or brand Tailwind classes). Never write hex/rgb values or Tailwind palette classes (`bg-blue-500`) elsewhere; the default palette is switched off.
- Build screens from `components/vemi/` first (live sheet at `/kit`).
- Every chart goes in a ChartCard with a real `soWhat`. Every metric shows `asOf` and its base; deltas name the window ("vs Aug 2026", from `lib/market/asOf.ts`).
- Amber (signal) appears only as one `<AlertChip>` per view. No red/green: health uses the violet band ramp with the band word.
- Run `npm run brand:check` before finishing any UI task; it must pass with 0 errors. `/brand-check` runs the full audit.
