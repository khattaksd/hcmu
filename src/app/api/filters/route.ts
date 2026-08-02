import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { STATIC_DATA_CACHE } from "@/lib/utils";

export async function GET() {
  const db = getDb();
  const makes = db.prepare("SELECT DISTINCT make FROM insurance_rates ORDER BY make").all() as { make: string }[];
  const bodyStyles = db.prepare("SELECT DISTINCT body_style FROM insurance_rates WHERE body_style IS NOT NULL ORDER BY body_style").all() as { body_style: string }[];
  const powerTypes = db.prepare("SELECT DISTINCT power_type FROM insurance_rates WHERE power_type IS NOT NULL ORDER BY power_type").all() as { power_type: string }[];
  const years = db.prepare("SELECT MIN(model_year) as min, MAX(model_year) as max FROM insurance_rates").all() as { min: number; max: number }[];

  return NextResponse.json({
    makes: makes.map((r) => r.make),
    bodyStyles: bodyStyles.map((r) => r.body_style),
    powerTypes: powerTypes.map((r) => r.power_type),
    yearRange: {
      min: years[0].min,
      max: years[0].max,
    },
  }, { headers: STATIC_DATA_CACHE });
}