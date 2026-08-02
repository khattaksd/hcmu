# Step 02: Dashboard Pages — Layout, Overview, Navigation

## Goal

Build the explore section layout with sidebar navigation and an overview dashboard page with key stats.

> ✅ **COMPLETED** — see **Build Report** at bottom.

## Prerequisites

- Step 01 complete (Next.js app with Turso connection working)

## Step 2.1 — Install shadcn Layout Components

```bash
npx shadcn@latest add sheet dropdown-menu avatar
```

## Step 2.2 — Explore Layout (with Sidebar)

Create `src/app/explore/layout.tsx` — applies the sidebar + main content layout to all `/explore/*` pages:

```tsx
import { Sidebar } from "@/components/sidebar";

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
```

## Step 2.3 — Sidebar Component

Create `src/components/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";

const links = [
  { href: "/explore", label: "Overview" },
  { href: "/explore/browse", label: "Browse Data" },
  { href: "/explore/by-make", label: "By Make" },
  { href: "/explore/by-body-style", label: "By Body Style" },
  { href: "/explore/trends", label: "Trends Over Time" },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-muted/30 p-4 flex flex-col gap-6">
      <Link href="/" className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity">
        <BarChart3 className="h-6 w-6 text-primary" />
        <span>HCMU Explorer</span>
      </Link>
      <div className="px-1 text-xs text-muted-foreground leading-relaxed">
        National vehicle insurance rate indexes from the Insurance Bureau of Canada.
        <br />
        <span className="text-[10px]">100 = average claim cost</span>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

## Step 2.4 — Explore Overview Page

Create `src/app/explore/page.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/lib/db";

function getOverviewStats() {
  const db = getDb();

  const total = db.prepare("SELECT COUNT(*) as count FROM insurance_rates").all() as { count: number }[];
  const makes = db.prepare("SELECT COUNT(DISTINCT make) as count FROM insurance_rates").all() as { count: number }[];
  const years = db.prepare("SELECT MIN(model_year) as min, MAX(model_year) as max FROM insurance_rates").all() as { min: number; max: number }[];
  const bodyStyles = db.prepare("SELECT body_style, COUNT(*) as count FROM insurance_rates WHERE body_style IS NOT NULL GROUP BY body_style ORDER BY count DESC").all() as { body_style: string; count: number }[];
  const avgIndexes = db.prepare(`
    SELECT
      ROUND(AVG(CASE WHEN collision IS NOT NULL THEN collision END), 1) as avg_collision,
      ROUND(AVG(CASE WHEN comp IS NOT NULL THEN comp END), 1) as avg_comp,
      ROUND(AVG(CASE WHEN dcpd IS NOT NULL THEN dcpd END), 1) as avg_dcpd,
      ROUND(AVG(CASE WHEN ab IS NOT NULL THEN ab END), 1) as avg_ab,
      ROUND(AVG(CASE WHEN theft_frequency IS NOT NULL THEN theft_frequency END), 1) as avg_theft
    FROM insurance_rates
  `).all() as { avg_collision: number; avg_comp: number; avg_dcpd: number; avg_ab: number; avg_theft: number }[];
  const topTheft = db.prepare(`
    SELECT make, model, model_year, theft_frequency
    FROM insurance_rates
    WHERE theft_frequency IS NOT NULL
    ORDER BY theft_frequency DESC
    LIMIT 5
  `).all() as { make: string; model: string; model_year: number; theft_frequency: number }[];

  return {
    total: total[0].count,
    makes: makes[0].count,
    minYear: years[0].min,
    maxYear: years[0].max,
    bodyStyles,
    avgIndexes: avgIndexes[0],
    topTheft,
  };
}

export default function ExploreOverviewPage() {
  const stats = getOverviewStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          National vehicle insurance relative claim cost indexes — IBC How Cars Measure Up
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Makes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.makes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Model Years</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.minYear} – {stats.maxYear}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Theft Index</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.avgIndexes?.avg_theft ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Average indexes with descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Average Indexes <span className="text-sm font-normal text-muted-foreground">(100 = average)</span></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            {[
              { key: "collision", label: "Collision", desc: "Collision insurance claim cost index" },
              { key: "comp", label: "Comp", desc: "Comprehensive insurance claim cost index (includes theft)" },
              { key: "dcpd", label: "DCPD", desc: "Direct Compensation Property Damage — claim cost when collision involves another insured driver" },
              { key: "ab", label: "AB", desc: "Accident Benefits — personal injury claim cost index" },
              { key: "theft_frequency", label: "Theft", desc: "Theft-related claim frequency index" },
            ].map((m) => {
              const val = stats.avgIndexes?.[m.key as keyof typeof stats.avgIndexes];
              return (
                <div key={m.key} className="group relative">
                  <p className="text-sm text-muted-foreground cursor-help" title={m.desc}>
                    {m.label}
                    <span className="ml-1 text-[10px] opacity-60 group-hover:opacity-100">ⓘ</span>
                  </p>
                  <p className="text-2xl font-bold">{val ?? "—"}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Body style distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicles by Body Style</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {stats.bodyStyles.map((row) => (
              <div key={row.body_style} className="text-center">
                <p className="text-2xl font-bold">{row.count}</p>
                <p className="text-sm text-muted-foreground">{row.body_style}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top theft vehicles */}
      <Card>
        <CardHeader>
          <CardTitle>Highest Theft Frequency Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topTheft.map((row, i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                <span>
                  {row.make} {row.model} ({row.model_year})
                </span>
                <span className="font-bold text-destructive">{row.theft_frequency}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metrics explanation */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>About the Metrics</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-4">
          <p>
            All indexes are relative to 100 (the average). A score of 122 means 22% above
            average claim costs; 87 means 13% below average.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Collision", desc: "Collision insurance claim cost index" },
              { label: "Comp", desc: "Comprehensive insurance claim cost index (includes theft)" },
              { label: "DCPD", desc: "Direct Compensation Property Damage — claim cost when collision involves another insured driver" },
              { label: "AB", desc: "Accident Benefits — personal injury claim cost index" },
              { label: "Theft", desc: "Theft-related claim frequency index" },
            ].map((m) => (
              <div key={m.label}>
                <span className="font-semibold text-foreground">{m.label}:</span>{" "}
                {m.desc}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Step 2.5 — Install Lucide Icons

```bash
npm install lucide-react
```

## Step 2.6 — Verify

```bash
npm run dev
# Visit http://localhost:3000/explore
# You should see cards with stats, avg indexes, body styles, top theft vehicles
```

## File Structure Added

```
src/
├── components/
│   ├── sidebar.tsx
│   └── ui/           (shadcn components)
├── app/
│   ├── layout.tsx     (root — minimal, no sidebar)
│   ├── page.tsx       (landing page)
│   └── explore/
│       ├── layout.tsx (app layout with sidebar)
│       └── page.tsx   (overview dashboard)
```

## Verification Checklist

- [ ] `/` shows landing page
- [ ] `/explore` overview page loads with real data from Turso
- [ ] Sidebar shows HCMU Explorer brand + navigation links
- [ ] Top theft vehicles list shows
- [ ] All card metrics render correctly
- [ ] Hovering metric labels shows description tooltips

---

## Build Report (Step 02 — Completed)

- ✅ Created `src/app/explore/layout.tsx` — sidebar + main flex layout.
- ✅ Created `src/components/sidebar.tsx` — brand (BarChart3), IBC attribution, 5 nav links.
- ✅ Updated `src/app/layout.tsx` — minimal root layout (Inter font, no sidebar).
- ✅ Created `src/app/explore/page.tsx` — server-rendered overview with metric descriptions.

### Live Data (from Turso embedded `hcmu.db`)

| Metric | Value |
|---|---|
| Total vehicles | 5,662 |
| Distinct makes | 46 |
| Model years | 1997 – 2025 |
| Body styles | 6 (2D, 4D, PU, SUV, VAN, WGN) |
| Power types | Gasoline/Diesel, Hybrid, Battery Electric, Plug-In Hybrid, Electric+Gasoline Generator |

### Top Theft-Frequency Vehicles

1. TOYOTA TUNDRA HEV 4WD 2023 — **4010**
2. JEEP WRANGLER UNLIMITED 4XE 4DR 4WD 2023 — **3349**
3. TOYOTA TUNDRA 4WD 2024 — **3058**

### Findings / Notes

- **`getDb()` returns the Turso compat lazy singleton** (`InstanceType<typeof Database>`), so `.prepare(...).all()` works synchronously. Queries are safe to run directly in RSC/server components.
- Avg indexes are percentages relative to 100 (= average); NULL fields (originally `.`) are excluded via `CASE WHEN x IS NOT NULL`. Theft top values are indexes ~30–40× the average — genuine outliers.
- **Build verified:** routes `/` (static landing), `/explore` (static), `/api/health` (dynamic) all compile clean. TypeScript passes.

### Verification Checklist

- [x] `/` shows landing page
- [x] `/explore` overview page loads with real data from Turso
- [x] Sidebar shows HCMU Explorer brand + navigation links
- [x] Top theft vehicles list shows
- [x] All card metrics render correctly

---

**Next → [03-data-table.md](03-data-table.md)**