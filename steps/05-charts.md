# Step 05: Charts — Visualizations & Dashboard Pages

## Goal

Build chart-driven dashboard pages under `/explore`: By Make, By Body Style, and Trends Over Time.

> ✅ **COMPLETED**

## Prerequisites

- Step 02 (layout + sidebar)
- Step 04 (API routes) — charts fetch from these endpoints

## Step 5.1 — By Make Page

Create `src/app/explore/by-make/page.tsx` (server component, serves plain props to client):

```tsx
import { getDb } from "@/lib/db";
import { ByMakeClient } from "./by-make-client";

export default function ByMakePage() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      make,
      COUNT(*) as vehicle_count,
      ROUND(AVG(CASE WHEN collision IS NOT NULL THEN collision END), 1) as avg_collision,
      ROUND(AVG(CASE WHEN comp IS NOT NULL THEN comp END), 1) as avg_comp,
      ROUND(AVG(CASE WHEN dcpd IS NOT NULL THEN dcpd END), 1) as avg_dcpd,
      ROUND(AVG(CASE WHEN ab IS NOT NULL THEN ab END), 1) as avg_ab,
      ROUND(AVG(CASE WHEN theft_frequency IS NOT NULL THEN theft_frequency END), 1) as avg_theft,
      MAX(model_year) as latest_year
    FROM insurance_rates
    GROUP BY make
    ORDER BY vehicle_count DESC
  `).all() as any[];

  // Turso driver returns class instances — spread to plain objects for client props
  const plainRows = rows.map((row) => ({ ...row }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">By Make</h1>
        <p className="text-muted-foreground mt-1">Compare average insurance indexes across manufacturers</p>
      </div>
      <ByMakeClient data={plainRows} />
    </div>
  );
}
```

Create `src/app/explore/by-make/by-make-client.tsx` — horizontal bar chart + data table with metric descriptions:

```tsx
"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const METRICS = [
  { key: "avg_collision", label: "Collision", desc: "Collision insurance claim cost index" },
  { key: "avg_comp", label: "Comp", desc: "Comprehensive insurance claim cost index" },
  { key: "avg_dcpd", label: "DCPD", desc: "Direct Compensation Property Damage claim cost index" },
  { key: "avg_ab", label: "AB", desc: "Accident Benefits personal injury claim cost index" },
  { key: "avg_theft", label: "Theft", desc: "Theft-related claim frequency index" },
];

export function ByMakeClient({ data }: { data: any[] }) {
  const [selectedMetric, setSelectedMetric] = useState("avg_theft");
  const [topN, setTopN] = useState("20");

  const sorted = [...data]
    .filter((d) => d[selectedMetric] !== null)
    .sort((a, b) => (b[selectedMetric] ?? 0) - (a[selectedMetric] ?? 0))
    .slice(0, parseInt(topN));

  const metricInfo = METRICS.find((m) => m.key === selectedMetric);

  return (
    <div className="space-y-6">
      {/* Metric selector + Top-N + description */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v ?? "avg_theft")}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select metric" /></SelectTrigger>
          <SelectContent>
            {METRICS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={topN} onValueChange={(v) => setTopN(v ?? "20")}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Top N" /></SelectTrigger>
          <SelectContent>
            {["10", "15", "20", "30", "46"].map((n) => <SelectItem key={n} value={n}>Top {n}</SelectItem>)}
          </SelectContent>
        </Select>
        {metricInfo && <p className="text-sm text-muted-foreground">{metricInfo.desc}</p>}
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader><CardTitle>{metricInfo?.label ?? ""} Index by Make</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sorted} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, "auto"]} />
              <YAxis type="category" dataKey="make" width={100} fontSize={12} />
              <Tooltip formatter={(value) => `${value ?? "—"} (100 = avg)`} />
              <Bar dataKey={selectedMetric} fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data table with metric tooltips */}
      <Card>
        <CardHeader><CardTitle>All Makes — Average Indexes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Make</TableHead>
                <TableHead>Vehicles</TableHead>
                <TableHead title="Collision insurance claim cost index">Collision</TableHead>
                <TableHead title="Comprehensive insurance claim cost index">Comp</TableHead>
                <TableHead title="Direct Compensation Property Damage claim cost index">DCPD</TableHead>
                <TableHead title="Accident Benefits personal injury claim cost index">AB</TableHead>
                <TableHead title="Theft-related claim frequency index">Theft</TableHead>
                <TableHead>Latest Year</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row: any) => (
                <TableRow key={row.make}>
                  <TableCell className="font-medium">{row.make}</TableCell>
                  <TableCell>{row.vehicle_count}</TableCell>
                  <TableCell>{row.avg_collision ?? "—"}</TableCell>
                  <TableCell>{row.avg_comp ?? "—"}</TableCell>
                  <TableCell>{row.avg_dcpd ?? "—"}</TableCell>
                  <TableCell>{row.avg_ab ?? "—"}</TableCell>
                  <TableCell>{row.avg_theft ?? "—"}</TableCell>
                  <TableCell>{row.latest_year}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Step 5.2 — By Body Style Page

Create `src/app/explore/by-body-style/page.tsx` (server component):

```tsx
import { getDb } from "@/lib/db";
import { BodyStyleClient } from "./body-style-client";

export default function ByBodyStylePage() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      body_style,
      COUNT(*) as vehicle_count,
      ROUND(AVG(CASE WHEN collision IS NOT NULL THEN collision END), 1) as avg_collision,
      ROUND(AVG(CASE WHEN comp IS NOT NULL THEN comp END), 1) as avg_comp,
      ROUND(AVG(CASE WHEN dcpd IS NOT NULL THEN dcpd END), 1) as avg_dcpd,
      ROUND(AVG(CASE WHEN ab IS NOT NULL THEN ab END), 1) as avg_ab,
      ROUND(AVG(CASE WHEN theft_frequency IS NOT NULL THEN theft_frequency END), 1) as avg_theft
    FROM insurance_rates
    WHERE body_style IS NOT NULL
    GROUP BY body_style
    ORDER BY body_style
  `).all() as any[];

  const plainRows = rows.map((row) => ({ ...row }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">By Body Style</h1>
        <p className="text-muted-foreground mt-1">Compare rates across vehicle body types</p>
      </div>
      <BodyStyleClient data={plainRows} />
    </div>
  );
}
```

Create `src/app/explore/by-body-style/body-style-client.tsx` — radar + bar chart + descriptions:

```tsx
"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const METRICS = [
  { key: "avg_collision", label: "Collision", desc: "Collision insurance claim cost index" },
  { key: "avg_comp", label: "Comp", desc: "Comprehensive insurance claim cost index" },
  { key: "avg_dcpd", label: "DCPD", desc: "Direct Compensation Property Damage claim cost index" },
  { key: "avg_ab", label: "AB", desc: "Accident Benefits personal injury claim cost index" },
  { key: "avg_theft", label: "Theft", desc: "Theft-related claim frequency index" },
];

const BODY_COLORS: Record<string, string> = {
  "2D": "#2563eb", "4D": "#16a34a", PU: "#d97706",
  SUV: "#dc2626", VAN: "#8b5cf6", WGN: "#ec4899",
};

export function BodyStyleClient({ data }: { data: any[] }) {
  const radarData = METRICS.map((m) => {
    const entry: any = { metric: m.label };
    for (const row of data) entry[row.body_style] = row[m.key] ?? 0;
    return entry;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Radar — multi-metric comparison */}
      <Card>
        <CardHeader><CardTitle>Multi-Metric Comparison</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis domain={[0, "auto"]} />
              {data.map((row: any) => (
                <Radar key={row.body_style} name={row.body_style} dataKey={row.body_style}
                  stroke={BODY_COLORS[row.body_style] ?? "#666"}
                  fill={BODY_COLORS[row.body_style] ?? "#666"} fillOpacity={0.1} />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Theft bar chart */}
      <Card>
        <CardHeader><CardTitle>Theft Frequency by Body Style</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="body_style" />
              <YAxis domain={[0, "auto"]} />
              <Tooltip formatter={(value) => `${value ?? "—"} (100 = avg)`} />
              <Bar dataKey="avg_theft" radius={[4, 4, 0, 0]}>
                {data.map((entry: any, idx: number) => <Cell key={idx} fill={BODY_COLORS[entry.body_style] ?? "#666"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Body Style Averages</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {data.map((row: any) => (
              <div key={row.body_style} className="border rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{row.body_style}</p>
                <p className="text-xs text-muted-foreground">{row.vehicle_count} vehicles</p>
                <div className="mt-2 space-y-1 text-xs">
                  <p title="Collision insurance claim cost index">Coll: {row.avg_collision ?? "—"}</p>
                  <p title="Comprehensive insurance claim cost index">Comp: {row.avg_comp ?? "—"}</p>
                  <p title="Direct Compensation Property Damage claim cost index">DCPD: {row.avg_dcpd ?? "—"}</p>
                  <p title="Accident Benefits personal injury claim cost index">AB: {row.avg_ab ?? "—"}</p>
                  <p title="Theft-related claim frequency index">Theft: {row.avg_theft ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metric descriptions */}
      <Card className="lg:col-span-2 bg-muted/30">
        <CardHeader><CardTitle>Metric Descriptions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
            {METRICS.map((m) => (
              <div key={m.key}>
                <span className="font-semibold text-foreground">{m.label}:</span> {m.desc}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Step 5.3 — Trends Page

Create `src/app/explore/trends/page.tsx`:

```tsx
import { TrendsClient } from "./trends-client";

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trends Over Time</h1>
        <p className="text-muted-foreground mt-1">
          Track how insurance indexes have changed across model years
        </p>
      </div>
      <TrendsClient />
    </div>
  );
}
```

Create `src/app/explore/trends/trends-client.tsx` — SWR-powered multi-series line chart:

```tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const METRICS = [
  { key: "collision", label: "Collision", color: "#2563eb", desc: "Collision insurance claim cost index" },
  { key: "comp", label: "Comp", color: "#16a34a", desc: "Comprehensive insurance claim cost index" },
  { key: "dcpd", label: "DCPD", color: "#d97706", desc: "Direct Compensation Property Damage claim cost index" },
  { key: "ab", label: "AB", color: "#dc2626", desc: "Accident Benefits personal injury claim cost index" },
  { key: "theft_frequency", label: "Theft", color: "#8b5cf6", desc: "Theft-related claim frequency index" },
];

// Component fetches filters via SWR, builds multi-series chart data,
// provides make/body-style filters and metric toggle pills.
// Each metric pill has a title attribute with its description.
```

## Step 5.4 — Verify

```bash
npm run dev

# Visit:
# http://localhost:3000/explore/by-make       → Bar chart + table of makes
# http://localhost:3000/explore/by-body-style  → Radar chart + bar chart
# http://localhost:3000/explore/trends        → Line chart with filter controls
```

## Verification Checklist

- [ ] `/explore/by-make` — bar chart renders, metric selector works, DCPD/AB have tooltips
- [ ] `/explore/by-body-style` — radar chart shows all 6 body styles, metric descriptions visible
- [ ] `/explore/trends` — line chart shows, metric toggles have description tooltips
- [ ] No console errors

---

## Build Report (Step 05 — Completed)

- ✅ `src/app/explore/by-make/page.tsx` + `by-make-client.tsx` — bar chart + table, metric & Top-N selectors, DCPD/AB tooltips + description text.
- ✅ `src/app/explore/by-body-style/page.tsx` + `body-style-client.tsx` — radar (5 metrics × 6 styles), theft bar chart, summary cards, metric legend.
- ✅ `src/app/explore/trends/page.tsx` + `trends-client.tsx` — multi-series line chart, SWR caching, metric toggle pills with descriptions.

### Verification (dev server, all passing)

| Page | SSR status | Charts | Descriptions |
|---|---|---|---|
| `/explore/by-make` | 200 | bar chart ✓ | Metric desc + header tooltips ✓ |
| `/explore/by-body-style` | 200 | radar + bar ✓ | Metric legend card ✓ |
| `/explore/trends` | 200 | line chart ✓ | Pill tooltips + metric legend ✓ |

### Findings / Notes

- **Recharts v3 Tooltip formatter** uses `ValueType | undefined`. Fix: `(value) => `${value ?? "—"} (100 = avg)``.
- **Per-bar coloring** uses `<Cell fill={...} />` inside `<Bar>` — raw `<rect>` children do not render in Recharts v3.
- **Client-prop serialization fix:** Turso compat driver rows are class instances; spread to plain objects (`rows.map((r) => ({ ...r }))`) before passing to client components.
- **Build gotcha:** `next build` fails if a dev server is running (both open the DB exclusively). Stop the dev server first.
- **SWR** replaces raw `useEffect`/`useCallback` for caching and dedup. Filters fetched via shared SWR key across Browse and Trends.
- All chart pages include metric description tooltips via `title` attributes and dedicated description sections/cards.

### Verification Checklist

- [x] `/explore/by-make` — bar chart renders, metric selector works, DCPD/AB have tooltips
- [x] `/explore/by-body-style` — radar chart shows all 6 body styles, metric descriptions visible
- [x] `/explore/trends` — line chart shows, metric toggles have description tooltips
- [x] No console errors

---

**Next → [06-deploy.md](06-deploy.md)**