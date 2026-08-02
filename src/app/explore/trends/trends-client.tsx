"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const METRICS = [
  { key: "collision", label: "Collision", color: "#2563eb", desc: "Collision insurance claim cost index" },
  { key: "comp", label: "Comp", color: "#16a34a", desc: "Comprehensive insurance claim cost index" },
  { key: "dcpd", label: "DCPD", color: "#d97706", desc: "Direct Compensation Property Damage claim cost index" },
  { key: "ab", label: "AB", color: "#dc2626", desc: "Accident Benefits personal injury claim cost index" },
  { key: "theft_frequency", label: "Theft", color: "#8b5cf6", desc: "Theft-related claim frequency index" },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SWR_OPTS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  dedupingInterval: 2000,
};

interface FiltersData {
  makes: string[];
  bodyStyles: string[];
}

interface TrendDataPoint {
  model_year: number;
  avg_value: number | null;
  vehicle_count: number;
}

function buildTrendsKey(make: string, bodyStyle: string, metrics: string[]): string | null {
  if (metrics.length === 0) return null;
  const params = new URLSearchParams();
  if (make) params.set("make", make);
  if (bodyStyle) params.set("body_style", bodyStyle);
  params.set("metrics", metrics.sort().join(","));
  return `/api/trends?${params}`;
}

export function TrendsClient() {
  const [make, setMake] = useState("");
  const [bodyStyle, setBodyStyle] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["collision", "comp"]);

  // Fetch filters once — SWR caches this key globally
  const { data: filters } = useSWR<FiltersData>(
    "/api/filters",
    fetcher,
    SWR_OPTS
  );

  // Build a cache key from the full query state. When make/bodyStyle/metrics change,
  // the key changes and SWR fetches with the new key — old keys stay cached.
  const trendsKey = buildTrendsKey(make, bodyStyle, selectedMetrics);

  const { data: trendData, isLoading } = useSWR<Record<string, TrendDataPoint[]>>(
    trendsKey,
    async (url: string) => {
      const u = new URL(url, window.location.origin);
      const metricsParam = u.searchParams.get("metrics")?.split(",") ?? [];
      const results = await Promise.all(
        metricsParam.map(async (metric) => {
          const p = new URLSearchParams({ metric });
          if (make) p.set("make", make);
          if (bodyStyle) p.set("body_style", bodyStyle);
          const res = await fetch(`/api/trends?${p}`);
          const json = await res.json();
          return json.data as TrendDataPoint[];
        })
      );
      const merged: Record<string, TrendDataPoint[]> = {};
      metricsParam.forEach((m, i) => { merged[m] = results[i]; });
      return merged;
    },
    { ...SWR_OPTS }
  );

  const toggleMetric = (key: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  // Combine all series into chart-compatible data
  const allYears = Array.from(
    new Set(Object.values(trendData ?? {}).flatMap((d) => d.map((p) => p.model_year)))
  ).sort();

  const chartData = allYears.map((year) => {
    const point: any = { year };
    for (const [metric, data] of Object.entries(trendData ?? {})) {
      const dp = data.find((d) => d.model_year === year);
      point[metric] = dp?.avg_value ?? null;
    }
    return point;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
        <Select value={make} onValueChange={(v) => setMake(v ?? "")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Makes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Makes</SelectItem>
            {(filters?.makes ?? []).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>

        </div>
        <div className="w-full sm:w-auto">
        <Select value={bodyStyle} onValueChange={(v) => setBodyStyle(v ?? "")}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All Body Styles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Styles</SelectItem>
            {(filters?.bodyStyles ?? []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={`group relative px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedMetrics.includes(m.key)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent"
            }`}
            title={m.desc}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {make || "All Makes"} {bodyStyle || "All Body Styles"} — Index Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!trendsKey || isLoading || !trendData ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, "auto"]} />
                <Tooltip formatter={(value) => `${value ?? "—"} (100 = avg)`} />
                <Legend />
                {selectedMetrics.map((metric) => {
                  const m = METRICS.find((x) => x.key === metric);
                  return (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      name={m?.label ?? metric}
                      stroke={m?.color ?? "#666"}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            100 = average. Values above 100 are above average claim costs.
          </p>
        </CardContent>
      </Card>

      {/* Data Density */}
      {trendData && Object.keys(trendData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Density</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {allYears.length} model years of data. Hover chart points for exact values.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric descriptions */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Metric Descriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
            {METRICS.map((m) => (
              <div key={m.key} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                <span><span className="font-semibold text-foreground">{m.label}:</span> {m.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}