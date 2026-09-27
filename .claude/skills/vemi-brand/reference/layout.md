# Layout

- Portal shell (this repo, plan D7): the left rail (`components/market/Sidebar.tsx`, 256px, 72px collapsed) + the filter header (`components/market/Header.tsx`) + the page. The kit's top `AppHeader` is not used. The website uses `components/v2/Nav.tsx` (72px sticky bar) and `.container-vemi` (1200px).
- Page order: PageHeader → (optional) one AlertChip → KPI row → ChartCards → tables/detail.
- Grid: KPI row as a CSS grid (2-up below 1024px, 4-up above). Charts: 12-column CSS grid, full width or 8+4 / 6+6 splits. Gaps 24px.
- Density: one idea per card. If a card needs two titles, it is two cards.
- Responsive: ≥1280 desktop layout; 768–1279 KPIs 2-up, charts full width; <768 single column; the rail collapses into `components/market/MobileNav.tsx` below 1024px (44px menu button).
- Dark (Ink) theme: the token set exists (`[data-theme="dark"]`) but no toggle ships (plan D6). A section can opt in with `data-theme="dark"` (the website's Ink band and footer do). Artwork that must stay Paper on Ink uses `--vm-paper`.
- RTL (deferred, plan D6): `<html lang="ar" dir="rtl">`. Components use logical properties (`padding-inline`, `margin-block`), so do the same in new CSS. The logo never mirrors; numbers stay left-to-right.
- Marketing pages may use the pattern (`/brand` key visuals) as a hero background; product screens never put pattern behind data.
