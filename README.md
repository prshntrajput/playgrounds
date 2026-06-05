# Playgrounds AI

A platform for discovering and monitoring sports venues in real time. It covers basketball and tennis courts, badminton halls, football and cricket grounds, parks, and stadiums.

The core idea is not the map — the map is just the interface. The product is a continuously updated database that turns community reports, reviews, photos, and AI analysis into a reliability score and a live crowd estimate for each venue. This tells you whether a ground is actually open and usable right now, not just whether it exists on a map.

---

## What It Does

- Search for sports venues near you or in any city
- See a reliability score for each venue based on recent activity, community reports, and AI analysis
- View live crowd estimates updated from user check-ins
- Submit reviews, report problems (flooded, closed, unsafe), and upload photos
- Venue owners can register unlisted venues or claim existing ones
- Admins review and approve new venue submissions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| Map | Leaflet, Esri satellite tiles |
| API | Cloudflare Workers, Hono |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth (Google OAuth) |
| AI | Gemini (default) with OpenAI fallback |
| Caching | Cloudflare KV |
| Monorepo | npm workspaces + Turborepo |

---

## Project Structure

```
playgrounds-ai/
├── apps/
│   ├── web/        Next.js frontend (Cloudflare Pages)
│   └── api/        Cloudflare Worker API (Hono)
├── packages/
│   ├── core/       Domain logic and use cases (no I/O, no framework)
│   ├── db/         Supabase repository adapters and migrations
│   ├── ai/         AI provider abstraction (Gemini, OpenAI)
│   └── shared/     Zod schemas, types, and constants shared across apps
```

---

## Getting Started

**Prerequisites:** Node.js 20+, a Supabase project, Cloudflare account, Gemini or OpenAI API key.

```bash
# Install dependencies
npm install

# Copy environment files and fill in values
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Run database migrations in Supabase SQL editor
# (see packages/db/src/migrations/)

# Start development servers
npm run dev
```

The web app runs on `http://localhost:3000` and the API on `http://localhost:8787`.

---

## Environment Variables

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787

# apps/api (via wrangler.toml or .dev.vars)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
```

---

## Scripts

```bash
npm run dev        # Start web + API in parallel
npm run build      # Build all packages
npm run lint       # Lint and typecheck
npm run test       # Run all tests
```

---

## Architecture

The codebase follows clean/hexagonal architecture. Business logic lives entirely in `packages/core` with zero dependencies on any framework, database, or HTTP library. The API and web app are thin delivery layers that call use cases from the core. All infrastructure (Supabase, AI providers, KV cache) implements interfaces defined by the core and is wired together once in `apps/api/src/container.ts`.

New sports, AI providers, reliability signals, and data sources are added by writing a new file that implements an existing interface — existing code is never modified.
