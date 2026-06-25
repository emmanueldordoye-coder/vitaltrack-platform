# VitalTrack Frontend Foundation

Next.js App Router frontend for VitalTrack, aligned to the backend API contract under `/api/v1`.

## Implemented foundation

- Route groups:
  - `(auth)` for sign-in flow
  - `(app)` for protected dashboard, facilities, inventory, and purchase orders
- Supabase-authenticated session handling:
  - Server + browser Supabase clients
  - Middleware route protection and auth redirects
  - Sign-in and sign-out server actions
- Tailwind UI scaffolding:
  - Root layout and app shell with navigation
  - Dashboard stat cards
  - Facilities and inventory tables with creation forms
- Typed API client layer for:
  - `facilities`
  - `inventory`
  - `purchase-orders`
- Zod validation for initial forms:
  - Sign in
  - Create facility
  - Create inventory item
- Backend-aligned TypeScript contracts in `src/types/contracts.ts`
- Jest-based tests for validation, API client behavior, and a UI component

## Required environment variables

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API base URL (includes /api/v1 path)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1

# Optional server-only override for server components/actions
API_BASE_URL=http://localhost:4000/api/v1
```

## Run locally

From repository root:

```bash
npm install
npm run dev --workspace=frontend
```

Or from `frontend/`:

```bash
npm install
npm run dev
```

## Build, lint, type-check, test

From repository root:

```bash
npm run build --workspace=frontend
npm run lint --workspace=frontend
npm run type-check --workspace=frontend
npm run test --workspace=frontend
```

From `frontend/`:

```bash
npm run build
npm run lint
npm run type-check
npm run test
```
