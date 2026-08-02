# Step 00: Data Ingestion — IBC XLSM → data/seed.sql + data/hcmu.db

## Data Source

Published annually by the **Insurance Bureau of Canada (IBC)**, the **How Cars Measure Up (HCMU)** dataset provides relative claim cost indexes for virtually every vehicle sold in Canada.

> **Download the source XLSM:** [ibc.ca/insurance-basics/auto/how-cars-measure-up](https://www.ibc.ca/insurance-basics/auto/how-cars-measure-up)

The workbook tab `1997-2025 Model Years` contains the data — column indexes are documented in the extraction script below.

## Goal

Extract the HCMU XLSM into two files in the `data/` subfolder:
- **`data/seed.sql`** — DDL + INSERT statements (human-readable, diffable in PRs)
- **`data/hcmu.db`** — pre-built SQLite database (committed to speed up deploys, skip rebuild on Vercel)

Both are committed. Intermediate files (`.xlsm`, `.db-wal`) are **gitignored**.

## Prerequisites

- **Python 3** with `openpyxl` installed (`pip install openpyxl`)
- **SQLite CLI** (`sqlite3`, usually pre-installed on macOS/Linux) or **Turso CLI** (`npm install -g turso`)

## Step 0.1 — Download the XLSM

Visit the IBC page above, download the latest `hcmu-e_20XX.xlsm`, and save it in the project root:

```bash
# Example (URL changes yearly — download manually from the IBC site)
# curl -LO https://www.ibc.ca/.../hcmu-e_2025.xlsm
```

> **Annual update:** IBC releases an updated workbook each year. Download the new one and re-run the steps below.

## Step 0.2 — Extract to data/seed.sql

Run the Python script below to transform the XLSM into `data/seed.sql`.

```python
#!/usr/bin/env python3
"""Extract HCMU-E XLSM → SQLite seed file.

Reads:  hcmu-e_20XX.xlsm  (gitignored, download from IBC)
Writes: data/seed.sql      (canonical DDL + INSERTs, committed)

Column layout in the "1997-2025 Model Years" tab:
  col 1  → collision
  col 3  → comp
  col 5  → dcpd
  col 7  → ab
  col 9  → make
  col 11 → model
  col 13 → body_style
  col 15 → model_year
  col 17 → power_type
  col 19 → theft_frequency

"." and empty cells → NULL
"""

import openpyxl
from pathlib import Path

SRC = next(Path(".").glob("hcmu-e_*.xlsm"), None)
if not SRC:
    raise SystemExit("No hcmu-e_*.xlsm found — download it from IBC first.")

OUT = Path("data") / "seed.sql"
OUT.parent.mkdir(exist_ok=True)

wb = openpyxl.load_workbook(SRC, data_only=True, keep_vba=False)

# Find the data tab (tab name changes with each year's release)
sheet_name = next((s for s in wb.sheetnames if "Model Years" in s), None)
if not sheet_name:
    raise SystemExit(f"No 'Model Years' tab found in {SRC}. Available: {wb.sheetnames}")

ws = wb[sheet_name]

rows = []
for r in range(4, ws.max_row + 1):
    make = ws.cell(r, 9).value
    model = ws.cell(r, 11).value
    year = ws.cell(r, 15).value

    if not make or not model or not year:
        continue

    def col(c):
        val = ws.cell(r, c).value
        if val == "." or val is None:
            return "NULL"
        return str(val)

    def str_col(c):
        val = ws.cell(r, c).value
        if val is None:
            return "NULL"
        return "'" + str(val).replace("'", "''") + "'"

    rows.append(
        f"({col(1)}, {col(3)}, {col(5)}, {col(7)}, "
        f"{str_col(9)}, {str_col(11)}, "
        f"{str_col(13)}, {year}, "
        f"{str_col(17)}, {col(19)})"
    )

sql = """DROP TABLE IF EXISTS insurance_rates;

CREATE TABLE insurance_rates (
    collision REAL,
    comp REAL,
    dcpd REAL,
    ab REAL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    body_style TEXT,
    model_year INTEGER NOT NULL,
    power_type TEXT,
    theft_frequency REAL
);

CREATE INDEX idx_make ON insurance_rates(make);
CREATE INDEX idx_model_year ON insurance_rates(model_year);
CREATE INDEX idx_body_style ON insurance_rates(body_style);
CREATE INDEX idx_power_type ON insurance_rates(power_type);

INSERT INTO insurance_rates (collision, comp, dcpd, ab, make, model, body_style, model_year, power_type, theft_frequency)
VALUES
""" + ",\n".join(rows) + ";"

OUT.write_text(sql)
print(f"✅ Extracted {len(rows)} rows → {OUT}")
```

**To run it:**

```bash
pip install openpyxl
mkdir -p data
python3 extract.py   # or paste the script inline
```

## Step 0.3 — Verify data/seed.sql

Check the row count:

```bash
grep -c "^(" data/seed.sql
# → 5662
```

## Step 0.4 — Build the Database

Run the prepare script to generate `data/hcmu.db` from `data/seed.sql`:

```bash
node data/prepare-db.mjs
```

Or with standard SQLite:

```bash
sqlite3 data/hcmu.db < data/seed.sql
```

Verify:

```bash
sqlite3 data/hcmu.db "SELECT COUNT(*) FROM insurance_rates;"
# → 5662
```

> **Note:** `npm run dev` and `npm run build` both run this automatically via `predev` / `prebuild`. The manual step is only needed for initial setup.

## Step 0.5 — Commit to Git

Both `data/seed.sql` and `data/hcmu.db` are committed. The `.db` is pre-built so Vercel deploys skip the rebuild step:

```bash
git add data/
git commit -m "seed: add HCMU-E 2025 data (5,662 rows)"
```

> **Annual update:** Download the new XLSM from IBC, re-run the Python extraction and `node data/prepare-db.mjs`, then commit the updated `data/` folder. Redeploy to Vercel — data refreshes instantly.

## File Inventory

| File | Tracked? | Role |
|---|---|---|
| `data/seed.sql` | ✅ **Yes** | Canonical DDL + INSERTs (human-readable, diffable) |
| `data/hcmu.db` | ✅ **Yes** | Pre-built SQLite database (speeds up Vercel deploys) |
| `hcmu-e_20XX.xlsm` | ❌ No (gitignored) | Upstream source — download from IBC annually |
| `data/prepare-db.mjs` | ✅ **Yes** | Rebuild script (runs via predev/prebuild, skips if up to date) |

---

**Next → [01-nextjs-scaffold.md](01-nextjs-scaffold.md)**