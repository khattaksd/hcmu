# Step 03: Browse Data — Filterable, Sortable Table

## Goal

Build a `/explore/browse` page with a server-rendered, filterable, sortable data table.

> ✅ **COMPLETED**

## Prerequisites

- Step 02 complete (layout + sidebar working)

## Step 3.1 — Install shadcn Table + Select Components

```bash
npx shadcn@latest add table select
```

## Step 3.2 — API Route for Data

Create `src/app/api/rates/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { STATIC_DATA_CACHE } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make");
  const bodyStyle = searchParams.get("body_style");
  const yearMin = searchParams.get("year_min");
  const yearMax = searchParams.get("year_max");
  const powerType = searchParams.get("power_type");
  const sortBy = searchParams.get("sort_by") || "model_year";
  const sortDir = searchParams.get("sort_dir") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  // Validate sort column (SQL injection prevention)
  const allowedSorts = [
    "collision", "comp", "dcpd", "ab", "theft_frequency",
    "model_year", "make", "model", "body_style", "power_type",
  ];
  const safeSort = allowedSorts.includes(sortBy) ? sortBy : "model_year";
  const safeDir = sortDir === "asc" ? "ASC" : "DESC";

  const conditions: string[] = [];
  const params: any[] = [];

  if (make) { conditions.push("make = ?"); params.push(make); }
  if (bodyStyle) { conditions.push("body_style = ?"); params.push(bodyStyle); }
  if (yearMin) { conditions.push("model_year >= ?"); params.push(parseInt(yearMin)); }
  if (yearMax) { conditions.push("model_year <= ?"); params.push(parseInt(yearMax)); }
  if (powerType) { conditions.push("power_type = ?"); params.push(powerType); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const db = getDb();
  const data = db.prepare(
    `SELECT * FROM insurance_rates ${where} ORDER BY ${safeSort} ${safeDir} LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);
  const count = db.prepare(
    `SELECT COUNT(*) as total FROM insurance_rates ${where}`
  ).all(...params);

  return NextResponse.json({
    data,
    total: (count[0] as { total: number }).total,
    page,
    limit,
  }, { headers: STATIC_DATA_CACHE });
}
```

## Step 3.3 — Filter Autocomplete API

Create `src/app/api/filters/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { STATIC_DATA_CACHE } from "@/lib/utils";

export async function GET() {
  const db = getDb();
  const makes = db.prepare("SELECT DISTINCT make FROM insurance_rates ORDER BY make").all() as { make: string }[];
  const bodyStyles = db.prepare("SELECT DISTINCT body_style FROM insurance_rates WHERE body_style IS NOT NULL ORDER BY body_style").all() as { body_style: string }[];
  const powerTypes = db.prepare("SELECT DISTINCT power_type FROM insurance_rates WHERE power_type IS NOT NULL ORDER BY power_type").all() as { power_type: string }[];
  const years = db.prepare("SELECT MIN(model_year) as min, MAX(model_year) as max FROM insurance_rates").all() as { min: number; max: number }[];

  return NextResponse.json({
    makes: makes.map((r) => r.make),
    bodyStyles: bodyStyles.map((r) => r.body_style),
    powerTypes: powerTypes.map((r) => r.power_type),
    yearRange: {
      min: years[0].min,
      max: years[0].max,
    },
  }, { headers: STATIC_DATA_CACHE });
}
```

## Step 3.4 — Browse Page

Create `src/app/explore/browse/page.tsx`:

```tsx
import { getDb } from "@/lib/db";
import { BrowseClient } from "./browse-client";

function getFilters() {
  const db = getDb();
  const makes = db.prepare("SELECT DISTINCT make FROM insurance_rates ORDER BY make").all() as { make: string }[];
  const bodyStyles = db.prepare("SELECT DISTINCT body_style FROM insurance_rates WHERE body_style IS NOT NULL ORDER BY body_style").all() as { body_style: string }[];
  const powerTypes = db.prepare("SELECT DISTINCT power_type FROM insurance_rates WHERE power_type IS NOT NULL ORDER BY power_type").all() as { power_type: string }[];
  const years = db.prepare("SELECT MIN(model_year) as min, MAX(model_year) as max FROM insurance_rates").all() as { min: number; max: number }[];

  return {
    makes: makes.map((r) => r.make),
    bodyStyles: bodyStyles.map((r) => r.body_style),
    powerTypes: powerTypes.map((r) => r.power_type),
    yearRange: { min: years[0].min, max: years[0].max },
  };
}

export default function BrowsePage() {
  const filters = getFilters();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Data</h1>
        <p className="text-muted-foreground mt-1">
          Filter and sort through all {">"}5,600 vehicle rate records
        </p>
      </div>
      <BrowseClient filters={filters} />
    </div>
  );
}
```

## Step 3.5 — Browse Client Component

Create `src/app/explore/browse/browse-client.tsx` — a client component using SWR for caching and deduplication, with table column tooltips describing each metric (including DCPD and AB):

```tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const SWR_OPTS = { revalidateOnFocus: false, revalidateOnReconnect: false, refreshInterval: 0, dedupingInterval: 2000 };

const COLS = [
  { key: "make", label: "Make", desc: "Vehicle manufacturer" },
  { key: "model", label: "Model", desc: "Vehicle model name and trim" },
  { key: "model_year", label: "Year", desc: "Model year" },
  { key: "body_style", label: "Body", desc: "Body style (2D, 4D, SUV, PU, VAN, WGN)" },
  { key: "power_type", label: "Power", desc: "Fuel or power type" },
  { key: "collision", label: "Collision", desc: "Collision insurance claim cost index" },
  { key: "comp", label: "Comp", desc: "Comprehensive insurance claim cost index" },
  { key: "dcpd", label: "DCPD", desc: "Direct Compensation Property Damage claim cost index" },
  { key: "ab", label: "AB", desc: "Accident Benefits personal injury claim cost index" },
  { key: "theft_frequency", label: "Theft", desc: "Theft-related claim frequency index" },
];

export function BrowseClient({ filters }: { filters: Filters }) {
  const [make, setMake] = useState("");
  const [bodyStyle, setBodyStyle] = useState("");
  const [powerType, setPowerType] = useState("");
  const [sortBy, setSortBy] = useState("model_year");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 50;

  const params = new URLSearchParams();
  if (make) params.set("make", make);
  if (bodyStyle) params.set("body_style", bodyStyle);
  if (powerType) params.set("power_type", powerType);
  params.set("sort_by", sortBy);
  params.set("sort_dir", sortDir);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const { data, isLoading } = useSWR(`/api/rates?${params}`, fetcher, SWR_OPTS);
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filters — 3 dropdowns */}
      <div className="flex flex-wrap gap-4">
        <Select value={make} onValueChange={(v) => { setMake(v ?? ""); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Makes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Makes</SelectItem>
            {filters.makes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={bodyStyle} onValueChange={(v) => { setBodyStyle(v ?? ""); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Body Styles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Styles</SelectItem>
            {filters.bodyStyles.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={powerType} onValueChange={(v) => { setPowerType(v ?? ""); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Power Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Power Types</SelectItem>
            {filters.powerTypes.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table with sortable headers + metric tooltips */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {COLS.map((col) => (
                <TableHead key={col.key} className="cursor-pointer select-none" title={col.desc}
                  onClick={() => { /* toggle sort */ }}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortBy === col.key && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* loading / empty / data rows */}
            {(data?.data ?? []).map((row, i) => (
              <TableRow key={i}>
                <TableCell>{row.make}</TableCell>
                <TableCell>{row.model}</TableCell>
                <TableCell>{row.model_year}</TableCell>
                <TableCell>{row.body_style ?? "—"}</TableCell>
                <TableCell className="text-xs">{row.power_type?.replace("Gasoline/Diesel", "Gas") ?? "—"}</TableCell>
                <TableCell title="Collision index">{row.collision ?? "—"}</TableCell>
                <TableCell title="Comp index">{row.comp ?? "—"}</TableCell>
                <TableCell title="DCPD — Direct Compensation Property Damage index">{row.dcpd ?? "—"}</TableCell>
                <TableCell title="AB — Accident Benefits index">{row.ab ?? "—"}</TableCell>
                <TableCell title="Theft frequency index">{row.theft_frequency ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{data ? `${Math.min((page - 1) * limit + 1, total)}–${Math.min(page * limit, total)} of ${total}` : "—"}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
```

## Step 3.6 — Verify

```bash
npm run dev
# Visit http://localhost:3000/explore/browse
# Should see:
# - Filter dropdowns for Make, Body Style, Power Type
# - Sortable table headers
# - DCPD/AB columns show descriptions on hover
# - Pagination
```

## Verification Checklist

- [ ] `/explore/browse` page loads with data from Turso
- [ ] Filter dropdowns populate correctly
- [ ] Clicking column headers sorts data
- [ ] Pagination works across all results
- [ ] Empty state displays correctly when filters yield no results
- [ ] Hovering over DCPD/AB headers shows their descriptions

---

## Build Report (Step 03 — Completed)

- ✅ Created `src/app/api/filters/route.ts` — returns distinct makes (46), body styles (6), power types (5), year range.
- ✅ Created `src/app/api/rates/route.ts` — paginated, filterable, sortable; SQL-injection-safe column whitelist.
- ✅ Created `src/app/explore/browse/page.tsx` — server component, passes filters to client.
- ✅ Created `src/app/explore/browse/browse-client.tsx` — client component with SWR, dropdowns, sortable table, pagination, metric tooltips.

### API Smoke Test (all passing)

| Endpoint | Result |
|---|---|
| `GET /api/filters` | 46 makes, 6 body styles, 5 power types, 1997–2025 |
| `GET /api/rates?limit=2` | Returns 2 rows, total 5,662 |
| `GET /api/rates?make=TOYOTA&limit=2` | Filtered to TOYOTA rows |

### Findings / Notes

- **shadcn Select** using `@base-ui/react/select` — `onValueChange` passes `string | null`. State setters need `v ?? ""` null-coalescing.
- Sort columns are whitelisted (`allowedSorts` array) in the API to prevent SQL injection.
- **DB lock fix:** `next dev` can crash with `File is locked by another process`. Fix: `PRAGMA journal_mode=WAL` + `PRAGMA busy_timeout=5000` in `src/lib/db.ts`. Kill stale `next` processes if it recurs.
- **SWR** replaced raw `useEffect` + `useCallback` for client caching, deduplication, and instant back-navigation.
- **Cache-Control headers** added: `public, s-maxage=31536000, stale-while-revalidate=86400`.
- All columns include `title` attributes with full metric descriptions for DCPD, AB, and others.

### Verification Checklist

- [x] `/explore/browse` page loads with data from Turso
- [x] Filter dropdowns populate correctly
- [x] Clicking column headers sorts data
- [x] Pagination works across all results
- [x] Empty state displays correctly when filters yield no results

---

**Next → [04-api-routes.md](04-api-routes.md)**