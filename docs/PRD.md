
# Vemi Client Portal — Interactive Frontend Demo PRD

## 1. Product Overview

Build an **interactive frontend-only demo** of the Vemi Client Portal.

Vemi is a retail audit intelligence platform that helps FMCG companies turn retail audit photos and field data into better business decisions.

For this demo, assume the client is:

**Baghdad Soft Drinks Company — Pepsi Iraq**

The demo should simulate Vemi auditing soft-drink retail execution across Iraq.

No backend, authentication system, AI processing, database, or real APIs are required.

Use realistic **dummy data only**.

---

# 2. Core Product Story

The portal should visually communicate this flow:

**Market Visits → Evidence → Performance → Insights → Decisions → Actions → Revisit → Verification**

The portal should NOT feel like a traditional BI dashboard full of charts.

Every major insight should help answer:

1. What is happening?
2. Where is it happening?
3. Why does it matter?
4. What should Pepsi do?
5. Which POS should the team act on?

---

# 3. Demo Scenario

Client subscription:

* Client: Baghdad Soft Drinks Company
* Brand: Pepsi
* Market: Iraq
* Category: Soft Drinks
* Monthly contracted coverage: **1,000 POS**
* Current month: September 2026
* Current visited POS: **742 / 1,000**
* Coverage: **74.2%**
* Days remaining: 9
* Main cities:

  * Baghdad
  * Basra
  * Erbil
  * Mosul
  * Najaf
  * Karbala

Example monitored brands:

* Pepsi
* Coca-Cola
* RC Cola
* 7UP
* Mirinda
* Mountain Dew

Example Pepsi SKUs:

* Pepsi 250ml Can
* Pepsi 330ml Can
* Pepsi 500ml PET
* Pepsi 1L PET
* Pepsi 2.25L PET
* Pepsi Zero 330ml

All numbers are fictional demo data.

---

# 4. Main Navigation

Use a collapsible left sidebar.

## Overview

* Executive Dashboard

## Market Intelligence

* Performance
* Competition
* Insights

## Execution

* Action Center
* POS Explorer
* Revisit Management

## Reports

* Monthly Reports
* Historical Trends

## Admin

* Audit Setup
* Users & Settings

Sidebar should support collapsed icon-only mode.

---

# 5. Global Header

Show:

* Page title
* Date range selector
* City filter
* Retailer / Channel filter
* Brand filter
* SKU filter
* Search
* Notifications
* User profile

Default period:

**September 2026 — Month to Date**

Global filters should visibly update the dummy charts and metrics.

---

# 6. Page Requirements

## PAGE 1 — Executive Dashboard

### Purpose

Give management an immediate understanding of market performance and where attention is required.

### Section A — Monthly Audit Coverage

Large visual progress component:

**742 / 1,000 POS Audited**

Show:

* 74.2% completion
* 258 POS remaining
* Days remaining
* Average visits/day
* Required visits/day
* Status: **On Track**

Use:

* Large circular progress indicator
* Small daily progress line chart
* Milestone markers: 25%, 50%, 75%, 100%

Add subtle B2B gamification:

**74% Market Coverage Achieved**

---

### Section B — Market Health

Show six KPI cards:

| KPI                     | Demo Value |
| ----------------------- | ---------: |
| On-Shelf Availability   |        87% |
| Share of Shelf          |        34% |
| Assortment Compliance   |        81% |
| Price Compliance        |        92% |
| POSM Compliance         |        68% |
| Overall Execution Score |     82/100 |

Each KPI should contain:

* Current value
* Benchmark / target
* Small sparkline
* Up/down indicator
* Click interaction

Clicking a KPI should navigate/filter the Performance page.

---

### Section C — What Needs Attention

Display 4–5 visual insight cards.

Examples:

**Critical**
Pepsi 500ml is unavailable in 42 audited POS.

**Opportunity**
Pepsi shelf share is below 25% in 31 high-volume Baghdad supermarkets.

**Execution Gap**
POSM is missing in 64 POS despite Pepsi products being available.

**Competitor Movement**
Coca-Cola gained +4.2 percentage points of shelf share in Basra.

Each card contains:

* Severity
* Short headline
* Metric
* Number of affected POS
* City / region
* CTA: **Investigate**

Avoid paragraphs.

---

### Section D — Iraq Market Map

Interactive map.

Show audited POS as clustered points.

Color-code based on execution score:

* Strong
* Average
* Needs Attention
* Critical

Allow switching map metric:

* Execution Score
* Availability
* Shelf Share
* POSM
* Price Compliance

Clicking a POS opens a side panel with basic store information.

---

### Section E — Market Comparison

Horizontal bar chart comparing:

* Baghdad
* Basra
* Erbil
* Mosul
* Najaf
* Karbala

Default metric: Execution Score.

Allow switching KPI.

---

# PAGE 2 — Performance

### Purpose

Understand Pepsi's retail execution across the market.

Use tabs inside the page rather than separate pages.

Tabs:

* Availability
* Shelf & Visibility
* Pricing
* Assortment
* POSM

---

## Availability Tab

Show:

### Headline

**87% On-Shelf Availability**

### Visuals

* Availability by city — bar chart
* Availability by channel — grouped bars
* SKU availability — ranked horizontal bars
* OOS reasons — donut chart
* OOS POS heatmap

Example insight:

**Pepsi 500ml accounts for 38% of detected Pepsi OOS cases.**

CTA:

**View affected POS**

---

## Shelf & Visibility Tab

Show:

* Pepsi share of shelf
* Pepsi vs competitors stacked bar
* Average facings by brand
* Shelf-position distribution:

  * Eye level
  * Upper shelf
  * Lower shelf
* Best/worst executing locations
* Realistic dummy shelf-photo cards

Example:

**Pepsi owns 34% of measured shelf space versus Coca-Cola at 39%.**

---

## Pricing Tab

Show:

* Average price by SKU
* Price distribution
* Price compliance %
* Price outliers
* Pepsi vs competitor price comparison
* City-level price variation

Use IQD.

Example:

Pepsi 500ml:

* Recommended demo price: 750 IQD
* Average observed: 770 IQD
* Compliance: 91%

---

## Assortment Tab

Show:

* Required SKU vs detected SKU matrix
* Assortment compliance %
* SKU penetration
* Missing SKU ranking
* Retailer/channel assortment comparison

Use a visual matrix:

Rows = SKUs
Columns = Cities / Channels

Use check / warning states.

---

## POSM Tab

Show:

* POSM compliance
* POSM presence
* Display type breakdown
* Missing POSM by city
* POSM by channel
* Best/worst execution photo gallery

Example POSM:

* Shelf strips
* Coolers
* Posters
* Stands
* Branded refrigerators
* Promotional displays

---

# PAGE 3 — Competition

### Purpose

Show where Pepsi is winning or losing versus competitors.

### Section A — Competitive Scoreboard

Cards for:

* Pepsi
* Coca-Cola
* RC Cola

Compare:

* Availability
* Share of shelf
* Average facings
* Price position
* Promotion presence
* Visibility score

---

### Section B — Shelf Battle

100% stacked bars showing share of shelf by:

* City
* Channel
* Retailer group

---

### Section C — Price Position

Scatter plot:

X-axis = Average Price
Y-axis = Shelf Share

Bubble size = Availability

Brands represented as bubbles.

---

### Section D — Competitive Map

Map showing areas where:

* Pepsi leads
* Coca-Cola leads
* Other brands lead

---

### Section E — Competitor Activity

Visual cards:

* New SKU detected
* Major price change
* Promotion detected
* Shelf-space increase
* New secondary display

Example:

**Coca-Cola shelf share increased from 35% → 42% across audited Basra supermarkets.**

---

# PAGE 4 — Insights

### Purpose

Turn raw analytics into business stories.

This page should visually feel more like an **intelligence feed** than a dashboard.

---

### Section A — Top Insights

Display ranked intelligence cards:

**#1 Availability Risk**

Pepsi 500ml has the highest OOS rate among core Pepsi SKUs.

42 POS affected
Estimated severity: High

Supporting mini-chart.

CTA:

**Explore POS**

---

### Section B — Opportunities

Cards ranked by potential impact:

Examples:

* Improve Pepsi 500ml distribution
* Increase facings in Baghdad supermarkets
* Deploy missing POSM
* Correct price execution
* Respond to Coca-Cola expansion

Each card shows:

* Opportunity
* POS affected
* Geographic concentration
* Impact score
* Confidence
* CTA

---

### Section C — Market Stories

Create visual storytelling blocks combining:

* Headline
* One chart
* One key number
* Optional shelf image
* Short recommendation

Example:

**Pepsi wins availability but loses shelf visibility in Baghdad**

Availability: Pepsi 91% vs Coca-Cola 89%

Shelf Share: Pepsi 31% vs Coca-Cola 41%

Recommendation:

**Prioritize additional facings in high-volume supermarkets.**

Keep copy short.

---

# PAGE 5 — Action Center

### Purpose

Convert insights into execution.

---

### Section A — Action Summary

Show:

* Critical Actions
* Open Actions
* In Progress
* Verified
* Resolved

Use compact cards.

---

### Section B — Priority Actions

Table/card hybrid.

Columns:

* Priority
* Issue
* Recommendation
* POS affected
* City
* KPI
* Owner
* Due date
* Status

Example:

**High**

Issue:
Pepsi 500ml OOS

Recommendation:
Prioritize replenishment

Affected:
18 high-priority POS

---

### Section C — Action Workflow

Use Kanban-style states:

**Detected → Reviewed → Assigned → Revisit Scheduled → Verified → Resolved**

Allow cards to be dragged between columns for demo purposes.

---

### Interactions

Users can:

* Change status
* Assign dummy user
* Change priority
* Open affected POS
* Flag POS for revisit
* Add a short note

All changes can live in frontend state only.

---

# PAGE 6 — POS Explorer

### Purpose

Allow users to investigate individual audited stores and see the evidence behind Vemi's insights.

---

### Main Layout

Toggle:

**Table | Map**

---

### Filters

* City
* District
* Channel
* Visit date
* Execution score
* Availability
* POSM compliance
* OOS
* Flagged for revisit

---

### POS Table

Columns:

* POS name
* City
* Channel
* Visit date
* Execution score
* Availability
* Share of shelf
* POSM
* Issues
* Revisit status

---

### POS Detail

Clicking a POS opens a large right-side drawer.

Show:

#### POS Information

* Store name
* Location
* Channel
* Last visit
* Collector

#### Execution Score

Large gauge: e.g. **71 / 100**

#### KPIs

* Availability
* Shelf share
* Pricing
* Assortment
* POSM

#### Detected Issues

Visual issue chips.

#### Photos

Show dummy product/shelf images.

Allow image lightbox.

Optional AI-style overlays:

* Product bounding boxes
* Price tags
* Brand labels
* POSM detection

#### Recommended Actions

Example:

**Restock Pepsi 500ml**

**Replace missing shelf strip**

#### CTA

**Flag for Revisit**

---

# PAGE 7 — Revisit Management

### Purpose

Allow the client to choose important POS that should be included in a future audit route.

This is important because Vemi may audit different POS each month.

---

### Section A — Revisit Queue

Show:

* POS
* Reason
* Priority
* Requested by
* Date flagged
* Planned audit month
* Status

---

### Section B — Revisit Pipeline

Visual stages:

**Flagged → Approved → Added to Route → Visited → Verified**

---

### Section C — Before / After Verification

For demo POS with historical visits, show:

**Previous Audit vs Revisit**

Use side-by-side:

* Shelf photo
* KPI values
* Issues
* Resolution status

Example:

Before:
Availability 60%

After:
Availability 95%

Show:

**+35 pts improvement**

Use visually satisfying success animations/progress.

---

# PAGE 8 — Monthly Reports

### Purpose

Give management a presentation-ready monthly retail execution story.

---

### Report Structure

#### 1. Coverage

1,000 contracted
742 audited

#### 2. Market Score

82/100

#### 3. Major KPI Results

Visual cards

#### 4. Biggest Risks

3–5 cards

#### 5. Biggest Opportunities

3–5 cards

#### 6. Competitive Summary

Charts

#### 7. Geographic Performance

Map

#### 8. Recommended Actions

Priority list

---

### Actions

Buttons:

* Export PDF
* Export Excel
* Share Report

Frontend demo can show success toast without generating actual files.

---

# PAGE 9 — Historical Trends

### Purpose

Show how the market evolves over time.

Because different POS may be visited each month, comparisons should primarily happen at:

* Market level
* City level
* Channel level
* Brand level
* SKU level

Do NOT imply that every monthly comparison uses identical stores.

---

### Visuals

Line charts for:

* Availability
* Share of shelf
* POSM
* Price compliance
* Execution score

Period:

April → September 2026

Allow comparison:

Pepsi vs Coca-Cola.

---

### Repeated POS

Separate section:

**Repeated POS Performance**

Only compare individual stores where Vemi has multiple audits.

---

# PAGE 10 — Audit Setup

### Purpose

Show what is being monitored under the client's Vemi subscription.

---

### Subscription Card

**September 2026 Audit**

* 1 Category
* 1,000 POS
* Iraq
* Soft Drinks
* Monthly Audit

---

### Monitored Brands

Cards:

* Pepsi
* Coca-Cola
* RC Cola
* Others

---

### Monitored SKUs

Editable-looking table.

---

### Coverage Scope

Show:

* Cities
* Channels
* Target POS
* Current coverage

---

### KPI Configuration

Show configurable targets:

* Availability ≥ 95%
* Price Compliance ≥ 90%
* POSM Compliance ≥ 85%
* Assortment ≥ 90%

Frontend interaction only.

---

# PAGE 11 — Users & Settings

### Users

Dummy users:

* Commercial Director
* Sales Manager
* Trade Marketing Manager
* Key Account Manager
* Vemi Admin

Show:

* Name
* Role
* Access
* Status

---

### Notifications

Toggle settings:

* Critical OOS alerts
* Competitor movement
* Weekly summary
* Monthly report ready
* Revisit completed

---

# 7. Visual Design Direction

The interface should feel like a premium modern B2B intelligence platform.

Think:

**Retail Intelligence + Decision Operating System**

Avoid:

* Dense enterprise tables everywhere
* Excessive text
* Generic admin dashboard appearance
* Too many cards with equal visual importance

Use:

* Strong whitespace
* Large data visualization
* Maps
* Progress indicators
* Charts
* Heatmaps
* Actual-looking shelf photography
* Clear hierarchy
* Smooth animations
* Rounded but professional cards
* Subtle gradients
* Tooltips
* Hover states
* Skeleton/loading animations where useful

Use Pepsi branding only inside client/brand data.

Vemi should remain the platform brand.

---

# 8. Semantic Status System

Use consistent status styling throughout:

### Positive

* Performing well
* Target achieved
* Issue resolved

### Warning

* Below target
* Opportunity

### Critical

* Significant execution problem
* Immediate attention required

### Neutral

* Informational

Do not rely on color alone; always include icons/text.

---

# 9. Dummy Data Requirements

Create at least:

* 1,000 generated POS records
* 742 marked visited
* 258 pending
* 6 cities
* Multiple retail channels
* 6+ Pepsi SKUs
* 3+ competitors
* 100+ detected issues
* 30+ actions
* 25+ flagged revisit stores
* Historical dummy data for 6 months

POS names can be fictional, for example:

* Al Mansour Market 014
* Karrada Supermarket 021
* Zayouna Market 008
* Basra Central Market 017
* Najaf Grocery 032

Do not require real retailer information.

---

# 10. Core Demo Interactions

The prototype must feel interactive, not static.

Implement:

* Sidebar navigation
* Sidebar collapse
* Global filters
* Chart hover tooltips
* Chart filtering
* Tab switching
* Map interactions
* Table filtering
* Search
* Sorting
* Pagination
* POS drawer
* Image lightbox
* Flag POS for revisit
* Create action
* Update action status
* Drag/drop action cards
* Toggle table/map view
* Before/after comparison
* Notification toggles
* Toast confirmations
* Report export mock buttons

Changes should persist during the browser session using local state or localStorage.

---

# 11. Key UX Principle

Every important analytics module should follow:

**Metric → Comparison → Explanation → Location → Action**

Example:

### Availability

**87% ↓ 3 pts**

Main problem:
Pepsi 500ml

Affected:
42 POS

Concentration:
Baghdad

Recommended action:
Prioritize replenishment in 18 high-volume POS

**[View POS] [Create Action]**

---

# 12. Demo Narrative

A user opening the demo should naturally discover this story:

1. Vemi has audited **742 of 1,000 POS**.
2. Pepsi overall execution is healthy at **82/100**.
3. Availability is relatively strong.
4. Pepsi is losing shelf visibility to Coca-Cola in some locations.
5. Pepsi 500ml has an OOS problem.
6. POSM execution is significantly below target.
7. Vemi identifies where the problems are concentrated.
8. Vemi recommends specific actions.
9. The user flags selected stores for revisit.
10. The next audit verifies whether execution improved.

This story should be visible through the interface without requiring long explanatory text.

---

# 13. Frontend Technical Scope

Frontend only.

Preferred if no existing stack is specified:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Recharts or equivalent chart library
* Interactive map library
* Lucide icons
* Local dummy JSON / TypeScript dataset
* localStorage for temporary state

Desktop-first responsive design.

Optimize primarily for:

**1440px desktop**

Also support tablet layouts.

Mobile optimization is secondary for this demo.

---

# 14. Reusable Components

Create reusable components for:

* KPI Card
* Insight Card
* Opportunity Card
* Action Card
* Status Badge
* Progress Ring
* Chart Container
* Filter Bar
* Map
* POS Marker
* POS Drawer
* Photo Viewer
* Comparison Card
* Before/After Component
* Data Table
* Empty State
* Loading State
* Toast
* Page Header

Avoid duplicating components between pages.

---

# 15. Acceptance Criteria

The demo is successful when:

* All 11 pages are navigable.
* Navigation follows the defined hierarchy.
* Data looks realistic and internally consistent.
* Dashboard shows 742/1,000 monthly coverage.
* Charts react to filters.
* Users can drill from insights into affected POS.
* POS evidence can be inspected.
* Stores can be flagged for revisit.
* Actions can be created and moved through statuses.
* Revisited POS can show before/after comparisons.
* Competition can be compared visually.
* Historical performance can be explored.
* The interface prioritizes visual storytelling over text.
* The experience clearly moves from **data → insight → decision → action**.
* No backend is required.
* No real API integration is required.
* No actual AI functionality is required.

## Final Product Principle

Vemi should not feel like:

**“Here are your retail audit results.”**

It should feel like:

**“Here is what is happening in your market, what matters most, and what your team should do next.”**