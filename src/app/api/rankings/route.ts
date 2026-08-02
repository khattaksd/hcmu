import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { STATIC_DATA_CACHE } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get("metric") || "theft_frequency";
  const limit = parseInt(searchParams.get("limit") || "10");
  const direction = searchParams.get("dir") || "desc";
  const year = searchParams.get("year");
  const bodyStyle = searchParams.get("body_style");

  const allowedMetrics = ["collision", "comp", "dcpd", "ab", "theft_frequency"];
  const safeMetric = allowedMetrics.includes(metric) ? metric : "theft_frequency";
  const safeDir = direction === "asc" ? "ASC" : "DESC";
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const conditions: string[] = [`${safeMetric} IS NOT NULL`];
  const params: any[] = [];

  if (year) { conditions.push("model_year = ?"); params.push(parseInt(year)); }
  if (bodyStyle) { conditions.push("body_style = ?"); params.push(bodyStyle); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const db = getDb();
  const rows = db.prepare(`
    SELECT make, model, model_year, body_style, ${safeMetric}
    FROM insurance_rates
    ${where}
    ORDER BY ${safeMetric} ${safeDir}
    LIMIT ?
  `).all(...params, safeLimit);

  return NextResponse.json({
    metric: safeMetric,
    direction: safeDir,
    data: rows,
  }, { headers: STATIC_DATA_CACHE });
}