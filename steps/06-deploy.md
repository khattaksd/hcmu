# Step 06: Deploy to Vercel

## Goal

Deploy the HCMU Explorer to Vercel's free tier with the database accessible in production.

## Prerequisites

- Steps 00–05 complete (app runs locally)
- Vercel account (sign up at vercel.com)
- Git repo pushed to GitHub/GitLab

## Architecture Decision: Embedded vs Remote Database

This project uses **Turso Embedded** (`@tursodatabase/database`) which opens a local `.db` file. On Vercel, serverless functions run on ephemeral filesystems, so you have two options:

| Option | Pros | Cons |
|---|---|---|
| **A: Bundle DB with deploy** | Simple, no extra services; DB auto-generates from `seed.sql` via `prebuild` | Rebuild on data updates, larger deploy |
| **B: Switch to remote Turso** | Data updates independently, smaller deploy | Requires Turso account, network latency |

**Option A** is simpler for MVP. **Option B** is better for production.

---

## Option A: Deploy with Bundled Database

### Step 6A.1 — Push to Git

```bash
cd /home/sdk/chats/hcmu

# Create repo on GitHub/GitLab and push
gh repo create hcmu-explorer --public --push --source=.
# Or manually:
# git remote add origin https://github.com/YOUR_USERNAME/hcmu-explorer.git
# git push -u origin main
```

> **Note:** The database `data/hcmu.db` is **committed to git** — it's pre-built from `seed.sql` so Vercel deploys skip the rebuild step. The `prebuild` script (`node data/prepare-db.mjs`) still runs on every deploy but detects the db is up to date and exits instantly.

### Step 6A.2 — Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Follow the prompts:
- Link to your GitHub repo
- Vercel auto-detects Next.js ✓
- No environment variables needed (the default `./data/hcmu.db` works) — but you can set `DB_PATH=./data/hcmu.db` explicitly if desired

### Step 6A.4 — Verify

```bash
curl https://hcmu-explorer.vercel.app/api/health
# → {"status":"ok","rows":5662}
```

---

## Option B: Deploy with Remote Turso Database

### Step 6B.1 — Create a Remote Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.turso.tech/install.sh | sh

# Login and create a database
turso auth login
turso db create hcmu-db

# Seed it with your data
turso db shell hcmu-db < data/seed.sql

# Verify
turso db shell hcmu-db "SELECT COUNT(*) FROM insurance_rates;"
# → 5662

# Get connection details
turso db show hcmu-db --url
turso db tokens create hcmu-db
```

### Step 6B.2 — Install Remote Client

```bash
npm install @libsql/client
```

### Step 6B.3 — Create Remote DB Client

Create `src/lib/db-remote.ts`:

```typescript
import { createClient } from "@libsql/client";

let db: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (db) return db;
  db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return db;
}
```

> **Note:** The remote client uses `db.execute()` which returns `{ rows, columns }` — the API is different from the embedded compat API. You'll need to update all pages and routes to use `await db.execute(sql)` instead of the sync `prepare().all()` pattern.

### Step 6B.4 — Set Environment Variables on Vercel

```bash
vercel env add TURSO_DATABASE_URL
# Paste your database URL from `turso db show`

vercel env add TURSO_AUTH_TOKEN
# Paste your auth token from `turso db tokens create`

vercel --prod
```

### Step 6B.5 — API Migration Notes

The remote `@libsql/client` uses a different API than the embedded compat client:

| Embedded (`database/compat`) | Remote (`@libsql/client`) |
|---|---|
| `db.prepare(sql).all()` | `await db.execute(sql)` |
| Returns `Row[]` | Returns `{ rows: Row[], columns: string[] }` |
| Synchronous | Async (`await db.execute(sql)`) |

If you want one codebase that works both ways, create a wrapper in `src/lib/db-adapter.ts`.

For MVP, **Option A (bundled DB)** is simpler and avoids the API mismatch entirely.

---

## Post-Deploy Checklist

- [ ] `/api/health` returns `{"status":"ok","rows":5662}`
- [ ] Landing page at `/` loads with stats and marketing content
- [ ] `/explore` overview page loads with real data
- [ ] `/explore/browse` filters and sorts work
- [ ] `/explore/by-make`, `/explore/by-body-style`, `/explore/trends` render charts
- [ ] Mobile layout is responsive
- [ ] No CORS or mixed content errors

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Cannot find native binding` | Ensure `serverExternalPackages` is set in `next.config.ts` |
| DB file not found on Vercel | Check `DB_PATH` env var; Vercel cwd is the project root. Default is `./data/hcmu.db`. |
| `data/hcmu.db` not created on Vercel | The `prebuild` script runs `node data/prepare-db.mjs` which uses `@tursodatabase/database`. Ensure the package is in `dependencies`, not `devDependencies`. |
| Edge function timeout | Increase function timeout in `next.config.ts` or use Node.js runtime |
| DB lock error on build | Stop any running dev server (both open the DB exclusively) |

---

**Next → [07-ai-premium.md](07-ai-premium.md) (Future / Premium Feature)**