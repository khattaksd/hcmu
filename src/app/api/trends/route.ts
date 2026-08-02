import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { STATIC_DATA_CACHE } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make");
  const bodyStyle = searchParams.get("body_style");
  const metric = searchParams.get("metric") || "collision";

  const allowedMetrics = ["collision", "comp", "dcpd", "ab", "theft_frequency"];
  const safeMetric = allowedMetrics.includes(metric) ? metric : "collision";

  const conditions: string[] = [];
  const params: any[] = [];

  if (make) { conditions.push("make = ?"); params.push(make); }
  if (bodyStyle) { conditions.push("body_style = ?"); params.push(bodyStyle); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const db = getDb();
  const rows = db.prepare(`
    SELECT
      model_year,
      ROUND(AVG(CASE WHEN ${safeMetric} IS NOT NULL THEN ${safeMetric} END), 1) as avg_value,
      COUNT(*) as vehicle_count
    FROM insurance_rates
    ${where}
    GROUP BY model_year
    ORDER BY model_year
  `).all(...params);

  return NextResponse.json({
    metric: safeMetric,
    data: rows,
  }, { headers: STATIC_DATA_CACHE });
}