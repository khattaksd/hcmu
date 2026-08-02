import { Database } from "@tursodatabase/database/compat";
import path from "path";

let db: InstanceType<typeof Database> | null = null;

export function getDb() {
  if (db) return db;
  const dbPath = process.env.DB_PATH ?? "./data/hcmu.db";
  // The dataset is static (read from seed.sql) — always open read-only.
  // This avoids write-access issues on Vercel's read-only filesystem
  // and eliminates WAL journal overhead locally.
  db = new Database(path.resolve(process.cwd(), dbPath), {
    readonly: true,
    fileMustExist: true,
  });
  return db;
}