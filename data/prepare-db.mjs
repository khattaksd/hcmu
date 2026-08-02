#!/usr/bin/env node
/**
 * Prepare the SQLite database from seed.sql.
 *
 * Reads seed.sql and creates data/hcmu.db if:
 *   - the database doesn't exist yet, or
 *   - seed.sql has been modified since the database was created.
 *
 * This runs automatically before `next dev` and `next build`
 * via the "predev" and "prebuild" npm scripts.
 */

import { Database } from "@tursodatabase/database/compat";
import { readFileSync, existsSync, statSync, mkdirSync } from "fs";
import { resolve } from "path";

const DATA_DIR = resolve(process.cwd(), "data");
const DB_PATH = resolve(DATA_DIR, "hcmu.db");
const SEED_PATH = resolve(process.cwd(), "data", "seed.sql");

// Skip if seed.sql doesn't exist (fresh clone without seed — user docs explain)
if (!existsSync(SEED_PATH)) {
  console.log("⚠️  seed.sql not found — skipping database preparation");
  process.exit(0);
}

// Skip if the db exists and is newer than seed.sql
if (existsSync(DB_PATH)) {
  const seedMtime = statSync(SEED_PATH).mtimeMs;
  const dbMtime = statSync(DB_PATH).mtimeMs;
  if (dbMtime > seedMtime) {
    process.exit(0);
  }
}

console.log("📦 Preparing database from seed.sql...");

mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
const sql = readFileSync(SEED_PATH, "utf-8");
db.exec(sql);
// Flush WAL into main .db file so the committed artifact is self-contained
// (Vercel deploys only bundle the .db, not the .db-wal)
db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
db.close();

console.log(`✅  data/hcmu.db ready`);