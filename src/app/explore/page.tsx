import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/lib/db";

const METRICS = [
  { key: "collision", label: "Collision", description: "Collision insurance claim cost index" },
  { key: "comp", label: "Comp", description: "Comprehensive insurance claim cost index (includes theft)" },
  { key: "dcpd", label: "DCPD", description: "Direct Compensation Property Damage — claim cost when collision involves another insured driver" },
  { key: "ab", label: "AB", description: "Accident Benefits — personal injury claim cost index" },
  { key: "theft_frequency", label: "Theft", description: "Theft-related claim frequency index" },
];

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
            {METRICS.map((m) => {
              const val = stats.avgIndexes?.[m.key as keyof typeof stats.avgIndexes];
              return (
                <div key={m.key} className="group relative">
                  <p className="text-sm text-muted-foreground cursor-help" title={m.description}>
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

      {/* DCPD / AB explanation */}
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
            {METRICS.map((m) => (
              <div key={m.key}>
                <span className="font-semibold text-foreground">{m.label}:</span>{" "}
                {m.description}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}