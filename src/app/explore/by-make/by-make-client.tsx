"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#8b5cf6"];
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

  const chartHeight = Math.max(320, sorted.length * 24);

  const metricInfo = METRICS.find((m) => m.key === selectedMetric);
  const metricLabel = metricInfo?.label ?? selectedMetric;
  const metricColor = COLORS[METRICS.findIndex((m) => m.key === selectedMetric)] ?? "#2563eb";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
        <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v ?? "avg_theft")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            {METRICS.map((m) => (
              <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
        <div className="w-full sm:w-auto">
        <Select value={topN} onValueChange={(v) => setTopN(v ?? "20")}>
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="Top N" />
          </SelectTrigger>
          <SelectContent>
            {["10", "15", "20", "30", "46"].map((n) => (
              <SelectItem key={n} value={n}>Top {n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Metric description */}
      {metricInfo && (
        <p className="text-sm text-muted-foreground">{metricInfo.desc}</p>
      )}

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{metricLabel} Index by Make</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={sorted} layout="vertical" margin={{ left: 50, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, "auto"]} />
              <YAxis type="category" dataKey="make" width={80} fontSize={12} interval={0} />
              <Tooltip formatter={(value) => `${value ?? "—"} (100 = avg)`} />
              <Bar dataKey={selectedMetric} fill={metricColor} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Makes — Average Indexes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}