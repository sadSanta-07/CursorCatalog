# CursorCatalog

A fast, stable product browser for 200,000 items — built as a take-home assignment for CodeVector.

**Live:** https://cursor-catalog.vercel.app  
**Repo:** https://github.com/sadSanta-07/CursorCatalog

---

## The core problem

Standard offset pagination (`LIMIT 20 OFFSET 200`) breaks when data changes. If 50 products are inserted while someone is on page 3, their page 4 skips 50 products or repeats them. The assignment explicitly required this to not happen.

The solution is **cursor-based pagination**. Instead of tracking a position number, the client holds a pointer to the last item it saw — encoded as a base64 cursor containing `created_at` and `id`. The next page query is:

```sql
SELECT * FROM products
WHERE created_at < $1 OR (created_at = $1 AND id < $2)
ORDER BY created_at DESC, id DESC
LIMIT 21
```

New inserts never shift this anchor. The user sees a consistent, stable view regardless of what's happening to the data.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | API routes + UI in one deploy, free on Vercel |
| Database | Neon (Postgres) | Free tier, serverless-optimized, excellent with `@neondatabase/serverless` |
| Query | Raw SQL via `neon()` tagged template | Drizzle ORM doesn't support composite tuple comparisons cleanly — raw SQL was cleaner for cursor logic |
| ORM/Schema | Drizzle Kit | Schema definition and migrations only |
| Fonts | Fraunces, Public Sans, Space Mono | Design system requirement |

---

## Schema

```sql
products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
)
```

### Indexes

```sql
-- Default view: all products newest first
CREATE INDEX idx_products_created_at_id
  ON products (created_at DESC, id DESC);

-- Filtered view: category + newest first
CREATE INDEX idx_products_category_created_at_id
  ON products (category, created_at DESC, id DESC);
```

Without these, every paginated query is a full scan of 200k rows. With them, each page fetch is an index seek — fast regardless of how deep into the dataset you go.

---

## Seed script

`src/db/seed.ts` inserts 200,000 rows in a **single SQL statement** using `generate_series`:

```sql
INSERT INTO products (name, category, price, created_at)
SELECT
  'Product ' || i,
  (ARRAY['Electronics','Clothing','Books','Food','Sports'])[floor(random()*5+1)],
  round((random()*1000)::numeric, 2),
  NOW() - (random() * interval '365 days')
FROM generate_series(1, 200000) AS i
```

This runs in a few seconds. A loop-based approach inserting one row at a time would take minutes and hammer the DB with 200k round trips.

To run:
```bash
npx tsx src/db/seed.ts
```

---

## API

```
GET /api/products?category=Electronics&cursor=<base64>&limit=20
```

**Cursor format** (base64-encoded JSON):
```json
{ "createdAt": "2026-01-15T10:30:00Z", "id": "uuid-here" }
```

**Response:**
```json
{
  "items": [...],
  "nextCursor": "<base64 or null>"
}
```

When `nextCursor` is `null`, you're at the last page.

---

## Running locally

```bash
git clone https://github.com/sadSanta-07/CursorCatalog
cd CursorCatalog
npm install
```

Create `.env.local`:
```
DATABASE_URL=your_neon_connection_string
```

```bash
# Push schema
npx drizzle-kit push

# Create indexes
npx tsx src/db/migrate.ts

# Seed 200k products
npx tsx src/db/seed.ts

# Start dev server
npm run dev
```

---

## What I'd improve with more time

- **Search** — full-text search on product name using Postgres `tsvector` and a GIN index
- **Price range filter** — add `min_price` / `max_price` query params, composable with the cursor
- **Sort options** — cursor pagination makes sorting by other columns (e.g. price) harder but doable with a composite cursor
- **updated_at trigger** — add a Postgres trigger to auto-update `updated_at` on row changes rather than relying on the application layer
- **Rate limiting** — the API endpoint has no rate limiting right now
- **Tests** — integration tests for the cursor logic edge cases (last page, empty category, concurrent inserts)

---

## How I used AI

Used Claude throughout — primarily for boilerplate, debugging ESLint errors from React 19's stricter hooks rules, and UI iteration against the design system.

What it helped with: scaffolding the Drizzle schema, the seed script structure, fixing the `useEffect` setState linting error, and iterating on the UI design tokens.

What it got wrong that I caught:
- The initial cursor SQL used a tuple comparison `(created_at, id) < ($1, $2)` which the Neon client didn't interpolate correctly — returning 0 results on page 2. I debugged this with console logs, identified the root cause (all seed rows had identical timestamps from the single-statement insert), and fixed both the SQL and the seed script.
- The `useCallback` + `useEffect` approach for fetching triggered a React 19 cascading renders lint error. Restructured to define the async function inside the effect body instead.

The cursor pagination logic, index design, and debugging were done with full understanding — not copy-pasted and hoped for.