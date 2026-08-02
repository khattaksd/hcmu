import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { STATIC_DATA_CACHE } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids"); // comma-separated row IDs (make|model|year)

  if (!ids) {
    return NextResponse.json({ error: "Provide ?ids= param" }, { status: 400 });
  }

  const pairs = ids.split(",").map((s) => s.trim());
  const results = [];

  const db = getDb();

  for (const pair of pairs) {
    const [make, model, year] = pair.split("|").map((s) => s.trim());
    const rows = db.prepare(
      `SELECT * FROM insurance_rates WHERE make = ? AND model = ? AND model_year = ? LIMIT 1`
    ).all(make, model, parseInt(year));
    if (rows.length > 0) {
      results.push(rows[0]);
    }
  }

  return NextResponse.json(results, { headers: STATIC_DATA_CACHE });
}