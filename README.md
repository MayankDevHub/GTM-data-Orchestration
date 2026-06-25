# GTM Data Orchestration System

A lightweight MVP that ingests lead data from multiple file sources, cleans and organizes it into a single structured store, and surfaces it through a dashboard for tracking and decision-making.

Built for the Braahmam International GTM Data Orchestration assignment.

> Live preview: open the app, go to **Import**, upload `public/sample-leads.csv`, then visit **Dashboard** / **Leads** / **Analytics**.

---

## 1. Approach

Real GTM data arrives in inconsistent formats from forms, ad platforms, exports and manual lists. The system focuses on three steps:

1. **Ingest** — accept CSV/Excel uploads from any number of sources in one screen.
2. **Process** — normalize column names, trim values, validate status, deduplicate by `email + name` (both within the batch and against existing database records), drop rows with no name.
3. **Serve** — store clean rows in a single `leads` table and expose KPIs, source mix, status mix, monthly trend, and a searchable/filterable lead table.

The stack is intentionally small so the pipeline (upload → clean → store → analyze) is easy to read end-to-end.

## 2. System Architecture

```
   ┌────────────────────────┐     ┌──────────────────────┐
   │ CSV / Excel uploads    │ ──▶ │ Import page          │
   │ (multiple sources)     │     │  • parse (papaparse, │
   └────────────────────────┘     │    xlsx)             │
                                  │  • clean + dedupe    │
                                  │  • DB dedup check    │
                                  │  • preview new only  │
                                  └──────────┬───────────┘
                                             │ insert
                                             ▼
                                  ┌──────────────────────┐
                                  │ Supabase Postgres    │
                                  │  leads / sources /   │
                                  │  activities          │
                                  │  + unique index      │
                                  └──────────┬───────────┘
                                             │ select
                                             ▼
   ┌────────────────────────┐     ┌──────────────────────┐
   │ Dashboard / Leads /    │ ◀── │ React Query hooks    │
   │ Analytics (Recharts)   │     │ (src/data/leads.ts)  │
   └────────────────────────┘     └──────────────────────┘
```

- **Frontend**: React 19 + TanStack Start (file-based routing) + Tailwind v4 + shadcn/ui + Recharts.
- **Backend**: Supabase (Postgres + auto Data API). No auth (per assignment scope).
- **Client lib**: `@/integrations/supabase/client` for all reads/writes.

## 3. Database Schema

Three tables in the `public` schema.

### `leads`
| column      | type        | notes                           |
| ----------- | ----------- | ------------------------------- |
| id          | uuid PK     | default `gen_random_uuid()`     |
| name        | text        | required                        |
| email       | text        | normalized to lowercase         |
| phone       | text        |                                 |
| company     | text        |                                 |
| source      | text        | e.g. Website, LinkedIn, Referral |
| status      | text        | New / Contacted / Qualified / Converted / Lost (default `New`) |
| created_at  | timestamptz | default `now()`                 |

A unique index (`leads_dedupe_idx`) on `(lower(email), lower(name))` prevents duplicate rows at the database level.

### `sources`
| column       | type        | notes        |
| ------------ | ----------- | ------------ |
| id           | uuid PK     |              |
| source_name  | text        | unique label |
| created_at   | timestamptz |              |

### `activities`
| column         | type        | notes                          |
| -------------- | ----------- | ------------------------------ |
| id             | uuid PK     |                                |
| lead_id        | uuid        | FK → `leads.id`                |
| activity_type  | text        | e.g. email_sent, call, note    |
| created_at     | timestamptz |                                |

RLS is enabled on all three; policies allow public access (assignment requires no auth).

## 4. Data Flow

1. User selects one or more files on **Import**.
2. `papaparse` (CSV) or `xlsx` (Excel) parses each file in the browser.
3. `cleanRows()` does:
   - case-insensitive header matching (e.g. `Full Name` → `name`, `E-mail` → `email`)
   - trim whitespace, drop empty strings → `null`
   - lowercase email
   - coerce unknown status → `New`
   - dedupe by `(email, name)` within the batch
   - skip rows missing a name
4. Existing leads are fetched from the database and filtered out — **preview shows only genuinely new leads** with accurate skipped count.
5. **Save** inserts only the new leads into `leads` via Supabase.
6. React Query invalidates the `leads` cache; Dashboard, Leads, and Analytics re-fetch and update.

## 5. Assumptions

- No authentication is required — this is an internal MVP.
- Lead identity is approximated by `email + name`; production would use a stricter identity resolution step.
- Source values are free text from the uploaded file; the `sources` table is a reference list, not enforced via FK.
- All files use a header row. Files without headers are out of scope for the MVP.
- Activities are modeled in the schema but the MVP focuses on lead ingestion + analytics; the activities table is ready for future workflows.
- The dashboard counts use the current `leads` snapshot — no historical revisions.

## 6. Setup Instructions

Prerequisites: Node 20+, a Supabase project.

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.example .env
```

Fill in your Supabase credentials in `.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

```bash
# 3. Apply database migration (one-time)
#    Run the SQL in supabase/migrations/*.sql in the Supabase SQL Editor

# 4. Start dev server
npm run dev
```

Open http://localhost:8080, go to **Import**, and upload `public/sample-leads.csv`.

## 7. GitHub Deployment Guide

1. Push the project to GitHub.
2. Local clone:
   ```bash
   git clone https://github.com/<you>/<repo>.git
   cd <repo>
   npm install
   npm run dev
   ```

## 8. Vercel Deployment Guide

1. Push the project to GitHub.
2. Go to https://vercel.com/new and import the repository.
3. Framework preset: **Vite**. Build command: `npm run build`. Output dir: `dist`.
4. Add environment variables (Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
5. Deploy. Subsequent pushes to `main` auto-deploy.

---

## Project structure

```
src/
  components/        sidebar, KPI card, shadcn/ui primitives
  data/leads.ts      Supabase fetch hook + analytics helpers
  integrations/      Supabase client (auto-generated)
  routes/            __root, index (Dashboard), leads, import, analytics
supabase/
  migrations/        SQL schema + seed
public/
  sample-leads.csv   sample dataset for the Import page
```
