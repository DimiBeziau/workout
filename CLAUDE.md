# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build (also validates types)
npm run lint         # ESLint
npm run db:push      # Apply schema changes to SQLite via drizzle-kit
npm run db:studio    # Open Drizzle Studio (DB browser)
docker-compose up --build  # Full production deployment
```

## Architecture

**Stack:** Next.js 15 App Router · Tailwind CSS 4 · Drizzle ORM · better-sqlite3 · JWT auth (jose)

**Auth flow:** Login form → `app/actions/auth.ts` server action → JWT stored in httpOnly `session` cookie → `middleware.ts` (Edge) verifies JWT on every request using jose (no DB access in middleware).

**DB singleton:** `lib/db/index.ts` initializes better-sqlite3 with `globalThis.__db` to survive Next.js HMR reloads. Tables are created via raw `CREATE TABLE IF NOT EXISTS` on startup (no migration files needed). Admin user is seeded from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars using `INSERT OR IGNORE`.

**Route groups:**
- `app/(auth)/` — public routes (`/login`)
- `app/(dashboard)/dashboard/` — protected routes (`/dashboard`, `/dashboard/templates`)

The `(dashboard)` group layout handles auth redirect + Navbar rendering. The actual URL segment comes from the `dashboard/` folder inside it.

**Server Actions:** All mutations in `app/actions/` with `'use server'`. Client components call them via `useActionState` (forms) or `useTransition` (direct calls like delete/select).

**Weekly planning:** A `weekly_plans` row links a user + `week_start` (Monday date as `YYYY-MM-DD`) + `day_of_week` (1=Mon…7=Sun) to a `session_template_id` (NULL = rest/unplanned). The `setPlanAction` does delete+insert to emulate upsert.

## Key env vars

| Var | Default | Purpose |
|-----|---------|---------|
| `DATABASE_PATH` | `./data/dev.db` | SQLite file path |
| `JWT_SECRET` | (insecure default) | Must be set in production |
| `ADMIN_USERNAME` | `admin` | Auto-created on first start |
| `ADMIN_PASSWORD` | `changeme` | Auto-created on first start |

## Tailwind CSS 4

No `tailwind.config.js` — theme is defined via `@theme {}` in `app/globals.css`. Custom utilities (`glow-pink`, `glow-purple`, etc.) are in `@layer utilities`. Colors use CSS variables like `var(--color-neon-pink)` in inline styles for dynamic values.
