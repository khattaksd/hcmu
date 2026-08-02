import { Database } from "@tursodatabase/database/compat";
import path from "path";

let db: InstanceType<typeof Database> | null = null;

export function getDb() {
  if (db) return db;
  const dbPath = process.env.DB_PATH ?? "./data/hcmu.db";
  const resolvedPath = path.resolve(process.cwd(), dbPath);

  // Vercel serverless functions have a read-only filesystem — open the
  // pre-bundled .db file in read-only mode.  Locally we open read-write
  // with WAL mode so `next dev` (multi-process) can read concurrently.
  if (process.env.VERCEL === "1") {
    db = new Database(resolvedPath, { readonly: true, fileMustExist: true });
  } else {
    db = new Database(resolvedPath);
    db.exec("PRAGMA journal_mode=WAL");
    db.exec("PRAGMA busy_timeout=5000");
  }

  return db;
}