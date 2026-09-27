# Copy and voice

- **Lead with the decision, then the evidence.** Title: "Stock-outs rose in 4 Erbil districts." Not: "Stock-out analysis".
- Precise, calm, evidence-first. Replace adjectives with numbers + time: "up 1.2 pts vs trailing 7 days", not "big increase".
- Always show basis: "As of 14:02 · 150 outlets".
- This repo audits monthly, so the comparison window is the prior month (plan D5): "▲ 1.2 pts vs Aug 2026" and "As of 21 Sep 2026", both from `lib/market/asOf.ts` (`vsPrior()`, `asOf()`). Never "vs previous visit".
- Sentence case everywhere (headings, buttons, tabs). Uppercase only in mono labels.
- Buttons are verbs: "Export report", "Add Basra", "View outlets".
- "We" = Vemi, "you" = the client. No emoji, no exclamation marks, no "Oops".
- The category is **market intelligence platform**. "Retail audit" is one capability, not what Vemi is.
- Errors say the fix: "Outlet IDs are 4 digits, e.g. 0148."
- Empty states say what is missing and when it arrives: "No visits in Basra yet. Your first data arrives [timeframe] after activation."
- Arabic: the name is ڤيمي. Write Arabic natively (no machine translation), set `lang="ar" dir="rtl"`, use `font-arabic`.
- Never present sample or synthetic numbers as real. Label demo data "Sample data" (portal banner) or "Sample figure" (a single number on the website). Inside the portal, never call it a "demo".
