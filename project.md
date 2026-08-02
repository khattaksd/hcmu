# HCMU Explorer — Canada Vehicle Insurance Rate Indexes

A cost-effective web app to explore national vehicle insurance rate indexes using IBC's **How Cars Measure Up** dataset.

## Architecture

```
Vercel (Free) — everything in one place
┌──────────────────────────────────────────┐
│  Next.js App Router  + shadcn/ui         │
│  + Recharts                              │
│  + data/hcmu.db (auto-generated from      │
│    data/seed.sql, read via                │
│    @tursodatabase/database)              │
│                                          │
│  Routes: /, /explore, /explore/browse... │
└──────────────────────────────────────────┘
```

The Turso database engine runs **embedded** in the serverless function — no separate cloud account needed. The `.db` file is committed to git and deployed with the app. This keeps deploys atomic, eliminates network calls, and costs $0.

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | Vercel-native, RSC, serverless APIs |
| UI | shadcn/ui + Tailwind CSS v4 | Beautiful, accessible, minimal bundle |
| Charts | Recharts v3 | React-native, composable, great for dashboards |
| Database | `@tursodatabase/database` | Embedded Turso engine, zero network calls, bundled with deploy |
| Data fetching | SWR | Client cache + dedup, instant back-navigation |
| AI (future) | OpenAI / Claude API | NL→SQL + trend insights (premium feature) |
| Hosting | Vercel (free tier) | Zero-config deploy, edge functions |

## Data Source

**How Cars Measure Up** is a national dataset published annually by the **Insurance Bureau of Canada (IBC)**. It provides relative claim cost indexes for virtually every passenger vehicle sold in Canada.

[IBC — How Cars Measure Up](https://www.ibc.ca/insurance-basics/auto/how-cars-measure-up)

## Data Model

Single table `insurance_rates`:

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `make` | TEXT | Manufacturer (e.g. TOYOTA) |
| `model` | TEXT | Model variant (e.g. RAV4 HEV 4DR AWD) |
| `body_style` | TEXT | 2D, 4D, PU, SUV, VAN, WGN |
| `model_year` | INTEGER | 1997–2025 |
| `power_type` | TEXT | Gasoline/Diesel, Hybrid, Battery Electric, Plug-In Hybrid, Electric+Gasoline Generator |
| `collision` | REAL | Collision claim cost index (NULL if not available) |
| `comp` | REAL | Comprehensive claim cost index (includes theft) (NULL if not available) |
| `dcpd` | REAL | Direct Compensation Property Damage claim cost index (NULL if not available) |
| `ab` | REAL | Accident Benefits personal injury claim cost index (NULL if not available) |
| `theft_frequency` | REAL | Theft claim frequency index (NULL if not available) |

All indexes are relative: **100 = average**.  
122 = 22% above avg, 87 = 13% below avg.

## Cost Estimate (Monthly)

| Service | Estimated Cost |
|---|---|
| Vercel (free tier) | $0 |
| Turso (embedded, no cloud account) | $0 |
| AI API (premium feature, ~$1-3/mo if enabled) | $0 MVP |
| **Total (MVP)** | **$0** |

## Route Structure

| Route | Page | Description |
|---|---|---|
| `/` | Landing page | Marketing, description, blog |
| `/explore` | Overview dashboard | Key stats, avg indexes, theft rankings |
| `/explore/browse` | Browse Data | Filterable/sortable table with all vehicles |
| `/explore/by-make` | By Make | Bar charts and table by manufacturer |
| `/explore/by-body-style` | By Body Style | Radar + bar charts by vehicle type |
| `/explore/trends` | Trends Over Time | Multi-series trends across model years |
| `/api/*` | Data APIs | 7 endpoints for programmatic access |

## Annual Update

1. Download new `hcmu-e_2026.xlsm` from IBC
2. Run `python3 scripts/extract.py`
3. Run `node data/prepare-db.mjs` (or `npm run dev` auto-generates it)
4. Commit the updated files and deploy

---

## Table of Contents — Development Steps

Each step lives in its own file under `steps/` for focused, token-efficient development.

| # | File | Description | Est. Time |
|---|---|---|---|
| 0 | [`steps/00-data-ingestion.md`](steps/00-data-ingestion.md) | Extract XLSM → SQL, create Turso DB, upload data | 15 min |
| 1 | [`steps/01-nextjs-scaffold.md`](steps/01-nextjs-scaffold.md) | Scaffold Next.js, shadcn/ui, Tailwind, libsql client | 15 min |
| 2 | [`steps/02-dashboard-pages.md`](steps/02-dashboard-pages.md) | Build dashboard layout, sidebar, overview page | 45 min |
| 3 | [`steps/03-data-table.md`](steps/03-data-table.md) | Filterable/sortable data table for all vehicles | 30 min |
| 4 | [`steps/04-api-routes.md`](steps/04-api-routes.md) | API routes for queries, stats, search autocomplete | 20 min |
| 5 | [`steps/05-charts.md`](steps/05-charts.md) | Charts: by make, by body style, trends over years | 45 min |
| 6 | [`steps/06-deploy.md`](steps/06-deploy.md) | Deploy to Vercel, set up env vars | 10 min |

### Future (Post-MVP)

| # | File | Description |
|---|---|---|
| 7 | [`steps/07-ai-premium.md`](steps/07-ai-premium.md) | Natural-language → SQL, AI trend insights, vehicle comparison |

---

## How to Use These Steps

1. Open the step file in your agent context.
2. Follow the instructions — each step is self-contained with exact commands and code.
3. Each step assumes the previous steps are complete.
4. For post-MVP steps (07+), revisit when ready.

## Key Decisions

- **Single DB file** — National dataset, one schema, no multi-province complexity.
- **Routes under `/explore/` prefix** — clean app namespace, root reserved for marketing.
- **Single table** over normalized makes/models — simpler queries for analysis, no joins needed.
- **NULL for missing data** — `.` values in Excel become SQL NULL. Queries use `IS NOT NULL` to filter.
- **Server-side data fetching** via Next.js server components → minimizes client bundle.
- **No auth in MVP** — data is public (insurance indexes, not PII). Auth can be added later for premium AI features.
- **Turso Embedded over Turso Cloud** — the `@tursodatabase/database` package bundles the Turso engine (Rust → NAPI addon) directly in the app. The `.db` file is committed to git and deployed with Vercel. Zero network calls, zero external accounts, $0.
- **DCPD/AB kept with full descriptions** — these are standard IBC metrics; labels include tooltips explaining what they measure.