import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { STATIC_DATA_CACHE } from "@/lib/utils";

export async function GET() {
  try {
    const db = getDb();
    const stmt = db.prepare("SELECT COUNT(*) AS count FROM insurance_rates");
    const rows = stmt.all() as { count: number }[];
    return NextResponse.json({ status: "ok", rows: Number(rows[0].count) }, { headers: STATIC_DATA_CACHE });
  } catch (error) {
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }
}