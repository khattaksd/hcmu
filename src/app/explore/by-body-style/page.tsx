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

  // Turso driver returns class instances — convert to plain objects for client props
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