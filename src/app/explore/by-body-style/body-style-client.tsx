"use client";

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
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
  // Build radar-compatible data: one entry per metric
  const radarData = METRICS.map((m) => {
    const entry: any = { metric: m.label };
    for (const row of data) {
      entry[row.body_style] = row[m.key] ?? 0;
    }
    return entry;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Metric Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis domain={[0, "auto"]} />
              {data.map((row: any) => (
                <Radar
                  key={row.body_style}
                  name={row.body_style}
                  dataKey={row.body_style}
                  stroke={BODY_COLORS[row.body_style] ?? "#666"}
                  fill={BODY_COLORS[row.body_style] ?? "#666"}
                  fillOpacity={0.1}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Theft comparison bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Theft Frequency by Body Style</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="body_style" />
              <YAxis domain={[0, "auto"]} />
              <Tooltip formatter={(value) => `${value ?? "—"} (100 = avg)`} />
              <Bar dataKey="avg_theft" radius={[4, 4, 0, 0]}>
                {data.map((entry: any, idx: number) => (
                  <Cell key={idx} fill={BODY_COLORS[entry.body_style] ?? "#666"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary table */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Body Style Averages</CardTitle>
        </CardHeader>
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

      {/* Metrics legend */}
      <Card className="lg:col-span-2 bg-muted/30">
        <CardHeader>
          <CardTitle>Metric Descriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
            {METRICS.map((m) => (
              <div key={m.key}>
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