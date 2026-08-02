import { Database } from "@tursodatabase/database/compat";
import path from "path";

let db: InstanceType<typeof Database> | null = null;

export function getDb() {
  if (db) return db;
  const dbPath = process.env.DB_PATH ?? "./data/hcmu.db";
  db = new Database(path.resolve(process.cwd(), dbPath));
  // WAL mode allows concurrent readers — essential for next dev (multi-process)
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA busy_timeout=5000");
  return db;
}