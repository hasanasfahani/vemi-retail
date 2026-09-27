---
description: Audit UI code against the Vemi brand and fix violations
argument-hint: "[path or component, optional]"
---
Read `.claude/skills/vemi-brand/SKILL.md` and the reference files it points to.

Then audit this target against the Vemi brand: $ARGUMENTS (if empty, audit the UI files changed on this branch):

1. Run `npm run brand:check` and list every ERROR and warning.
2. Review manually for what the script can't see: charts without a real `soWhat`, more than one AlertChip per view, deltas without a named window ("vs Aug 2026"), metrics without `asOf`/`base`, violet used as small text instead of `primary-text`, missing focus states, controls under 44px, color-only meaning, off-voice copy.
3. Report findings as a short table (file:line · rule · fix).
4. Fix them, re-run the script until it passes, and summarize what changed.
