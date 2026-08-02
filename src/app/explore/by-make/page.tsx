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

  // Turso driver returns class instances — convert to plain objects for client props
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