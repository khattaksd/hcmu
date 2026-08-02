import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { STATIC_DATA_CACHE } from "@/lib/utils";

export async function GET() {
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
  `).all();

  return NextResponse.json(rows, { headers: STATIC_DATA_CACHE });
}