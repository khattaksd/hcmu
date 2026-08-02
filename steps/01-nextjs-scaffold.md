# Step 01: Next.js Scaffold + shadcn/ui + Turso Embedded

## Goal

Set up the Next.js project with Tailwind, shadcn/ui components, and the Turso Embedded database client (`@tursodatabase/database`).

## Prerequisites

- Node.js 18+
- Step 00 complete (`seed.sql` exists in the project root)
- (`data/hcmu.db` auto-generates from `seed.sql` via `npm run dev` — no manual step needed)

## Step 1.1 — Create Next.js App

```bash
cd /home/sdk/chats/hcmu
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm
```

> **Note:** The target is `.` (current directory), not a subfolder. The Next.js app lives at the repo root.

## Step 1.2 — Install Dependencies

```bash
# UI & charts
npx shadcn@latest init -d
npx shadcn@latest add button card table input select badge separator skeleton

npm install recharts

# Turso Embedded database engine
npm install @tursodatabase/database
```

## Step 1.3 — Environment Variables

Create `.env.local` (optional — the default path works out of the box):

```
# Path to the HCMU SQLite database (auto-generated from seed.sql)
# Default is "./data/hcmu.db" (data/ subfolder)
DB_PATH=./data/hcmu.db
```

Add to `.env.example` for documentation:

```
DB_PATH=
```

## Step 1.4 — Next.js Config

Add `serverExternalPackages` to `next.config.ts` so Next.js doesn't try to bundle the native Turso addon:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@tursodatabase/database"],
};

export default nextConfig;
```

## Step 1.5 — Database Client Singleton

Create `src/lib/db.ts`:

```typescript
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
```

> **How it works:** `@tursodatabase/database` is the Turso Embedded Rust engine compiled as a NAPI addon. It opens the local `.db` file directly — zero network calls, zero accounts needed.
>
> We use the `/compat` subpath export (sync API) because Turbopack has trouble preserving the prototype chain on the async promise-based API. The compat API uses `prepare().all()` for queries.

## Step 1.6 — Test Connection

Create `src/app/api/health/route.ts`:

```typescript
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
```

## Step 1.7 — Run Dev Server & Verify

```bash
npm run dev
# Visit http://localhost:3000/api/health
# Expected: {"status":"ok","rows":5662}
```

## Directory Structure After This Step

```
.                        ← repo root = Next.js app root
├── .env.local
├── next.config.ts       ← serverExternalPackages added
├── src/
│   ├── lib/
│   │   ├── db.ts        # Turso Embedded client (compat API)
│   │   └── utils.ts     # cn() helper + STATIC_DATA_CACHE constant
│   ├── app/
│   │   ├── api/
│   │   │   └── health/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx   # Minimal root layout (no sidebar)
│   │   └── page.tsx     # Landing page (marketing + blog)
│   └── components/
│       └── ui/           # shadcn components
├── seed.sql              # from Step 00
├── data/
│   ├── prepare-db.mjs    # auto-generates data/hcmu.db from seed.sql
│   ├── seed.sql          # DDL + INSERTs
│   └── hcmu.db           # pre-built (committed, skip rebuild on Vercel)
├── data/
│   └── hcmu.db           # from Step 00 (auto-generated, gitignored)
├── package.json
└── tsconfig.json
```

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] `/api/health` returns `{"status":"ok","rows":5662}`
- [ ] `localhost:3000` shows the landing page (IBC / HCMU marketing)

---

**Next → [02-dashboard-pages.md](02-dashboard-pages.md)**