import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { STATIC_DATA_CACHE } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make");
  const bodyStyle = searchParams.get("body_style");
  const yearMin = searchParams.get("year_min");
  const yearMax = searchParams.get("year_max");
  const powerType = searchParams.get("power_type");
  const sortBy = searchParams.get("sort_by") || "model_year";
  const sortDir = searchParams.get("sort_dir") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  // Validate sort column (SQL injection prevention)
  const allowedSorts = [
    "collision", "comp", "dcpd", "ab", "theft_frequency",
    "model_year", "make", "model", "body_style", "power_type",
  ];
  const safeSort = allowedSorts.includes(sortBy) ? sortBy : "model_year";
  const safeDir = sortDir === "asc" ? "ASC" : "DESC";

  const conditions: string[] = [];
  const params: any[] = [];

  if (make) { conditions.push("make = ?"); params.push(make); }
  if (bodyStyle) { conditions.push("body_style = ?"); params.push(bodyStyle); }
  if (yearMin) { conditions.push("model_year >= ?"); params.push(parseInt(yearMin)); }
  if (yearMax) { conditions.push("model_year <= ?"); params.push(parseInt(yearMax)); }
  if (powerType) { conditions.push("power_type = ?"); params.push(powerType); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const db = getDb();
  const data = db.prepare(
    `SELECT * FROM insurance_rates ${where} ORDER BY ${safeSort} ${safeDir} LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);
  const count = db.prepare(
    `SELECT COUNT(*) as total FROM insurance_rates ${where}`
  ).all(...params);

  return NextResponse.json({
    data,
    total: (count[0] as { total: number }).total,
    page,
    limit,
  }, { headers: STATIC_DATA_CACHE });
}