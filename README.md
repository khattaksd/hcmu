# HCMU Explorer — Canada Vehicle Insurance Rate Indexes

Explore national vehicle insurance rate indexes using data from the Insurance Bureau of Canada's **How Cars Measure Up** (HCMU) publication.

> Full project overview → [`project.md`](project.md)

## What is HCMU?

Published annually by the **Insurance Bureau of Canada (IBC)**, HCMU provides relative claim cost indexes for virtually every vehicle sold in Canada. Indexes cover five metrics — Collision, Comp, DCPD, AB, and Theft — all relative to 100 (the average).

[Learn more on IBC's website](https://www.ibc.ca/insurance-basics/auto/how-cars-measure-up)

## Routes

| Path | Page |
|---|---|
| `/` | Landing page (marketing, description, blog) |
| `/explore` | Overview dashboard |
| `/explore/browse` | Filterable/sortable data table |
| `/explore/by-make` | Per-manufacturer bar charts |
| `/explore/by-body-style` | Radar + bar charts by body type |
| `/explore/trends` | Multi-series trends over model years |
| `/api/*` | Data API endpoints |

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Charts | Recharts v3 |
| Database | `@tursodatabase/database` (embedded Turso/SQLite engine, zero network calls) |
| Data fetching | SWR (client cache + dedup) |
| Hosting | Vercel (free tier) |

## Status

| Step | Status | Notes |
|---|---|---|
| Data Ingestion | ✅ Done | `data/seed.sql` + `data/hcmu.db` — 5,662 rows, 46 makes, model years 1997–2025 |
| Landing Page | ✅ Done | Marketing page with stats, CTA, blog section |
| Dashboard Pages | ✅ Done | Layout + sidebar + explore overview |
| Data Table | ✅ Done | Filterable/sortable table with pagination |
| API Routes | ✅ Done | 7 endpoints (rates, makes, filters, body-styles, trends, compare, rankings) |
| Charts | ✅ Done | by-make, by-body-style, trends with Recharts |
| Deploy | ⏳ | |
| AI Premium | ⏳ Future | |

## Getting Started

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Annual Data Update

1. Download new `hcmu-e_20XX.xlsm` from [IBC](https://www.ibc.ca/insurance-basics/auto/how-cars-measure-up)
2. Run the Python extraction from [`steps/00-data-ingestion.md`](steps/00-data-ingestion.md) to update `data/seed.sql`
3. Run `node data/prepare-db.mjs` to rebuild `data/hcmu.db`
4. Commit `data/` — redeploy to Vercel