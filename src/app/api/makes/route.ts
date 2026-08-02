import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { STATIC_DATA_CACHE } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get("sort_by") || "make";
  const sortDir = searchParams.get("sort_dir") || "asc";

  const allowedSorts = ["make", "avg_collision", "avg_comp", "avg_dcpd", "avg_ab", "avg_theft", "vehicle_count"];
  const safeSort = allowedSorts.includes(sortBy) ? sortBy : "make";
  const safeDir = sortDir === "desc" ? "DESC" : "ASC";

  const db = getDb();
  const rows = db.prepare(`
    SELECT
      make,
      COUNT(*) as vehicle_count,
      ROUND(AVG(CASE WHEN collision IS NOT NULL THEN collision END), 1) as avg_collision,
      ROUND(AVG(CASE WHEN comp IS NOT NULL THEN comp END), 1) as avg_comp,
      ROUND(AVG(CASE WHEN dcpd IS NOT NULL THEN dcpd END), 1) as avg_dcpd,
      ROUND(AVG(CASE WHEN ab IS NOT NULL THEN ab END), 1) as avg_ab,
      ROUND(AVG(CASE WHEN theft_frequency IS NOT NULL THEN theft_frequency END), 1) as avg_theft
    FROM insurance_rates
    GROUP BY make
    ORDER BY ${safeSort} ${safeDir}
  `).all();

  return NextResponse.json(rows, { headers: STATIC_DATA_CACHE });
}