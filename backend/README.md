# Backend API

Minimal Express + Supabase foundation for the VitalTrack backend.

## Structure

```text
backend/
├── src/
│   ├── api/
│   │   ├── middleware/    # Request context, auth, validation, errors
│   │   ├── routes/        # Versioned API routes
│   │   ├── schemas/       # Zod request schemas
│   │   ├── errors.ts
│   │   ├── response.ts
│   │   └── supabase-errors.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── supabase.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── database.ts
│   │   └── express.d.ts
│   ├── app.ts
│   └── server.ts
├── .eslintrc.json
├── package.json
└── tsconfig.json
```

## Environment

The backend reads the following variables:

- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `CORS_ALLOWED_ORIGINS` (comma-separated, required in production)
- `PORT` (optional, defaults to `4000`)
- `NODE_ENV`, `API_TIMEOUT_MS`, `LOG_LEVEL` (optional)

## Request context and auth

Each request gets:

- a request ID for traceable responses
- a request-scoped Supabase client
- optional authenticated user context resolved from a Bearer token

Protected routes rely on the caller's Supabase access token so database queries execute under Supabase Auth and row-level security policies.

## API response contract

Successful responses:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-25T18:00:00.000Z",
    "version": "v1"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": []
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-25T18:00:00.000Z",
    "version": "v1"
  }
}
```

## Sample endpoints

All application routes are mounted under `/api/v1`.

- `GET /health`
- `GET /facilities`
- `GET /facilities/:id`
- `POST /facilities`
- `GET /inventory`
- `GET /inventory/:id`
- `POST /inventory`
- `GET /purchase-orders`
- `GET /purchase-orders/:id`
- `POST /purchase-orders`

`/facilities`, `/inventory`, and `/purchase-orders` require a valid `Authorization: Bearer <supabase-access-token>` header.
