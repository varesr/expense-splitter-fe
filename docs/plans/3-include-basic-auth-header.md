# Feature 3: Include Basic Auth Header

## Context

The backend API is being secured with Basic Authentication. The frontend must include an `Authorization: Basic <base64>` header on all data-fetching API calls. Credentials (`SPLITTER_USER`, `SPLITTER_PWD`) must remain server-side only to avoid exposing them in the browser.

Currently, `transaction-service.ts` makes direct client-side fetch calls to the backend. Since the credentials cannot have a `NEXT_PUBLIC_` prefix, we need Next.js API routes to act as a server-side proxy that injects the auth header before forwarding requests to the backend.

The `healthCheck` endpoint does **not** require auth.

## Scope

- **In scope:** Basic Auth header on GET transactions and PUT paid transaction; server-side proxy routes; env var validation; tests
- **Out of scope:** healthCheck auth; UI changes; backend changes

---

## Implementation Plan

### Step 1: Create auth helper — `lib/auth.ts`

New server-side utility:
- Reads `SPLITTER_USER` and `SPLITTER_PWD` from `process.env`
- Throws a clear error if either is missing
- Returns `Basic <base64(user:pwd)>` using `Buffer.from` (Node.js only)

### Step 2: Create API route — `app/api/transactions/[year]/[month]/route.ts`

Proxy for `GET /transactions/{year}/{month}`:
- Calls `getBasicAuthHeader()` from `lib/auth.ts`
- Forwards request to `${NEXT_PUBLIC_API_URL}/transactions/{year}/{month}` with the `Authorization` header and existing cache-control headers
- Returns backend response (data or error status)

### Step 3: Create API route — `app/api/transactions/paid/route.ts`

Proxy for `PUT /transactions/paid`:
- Calls `getBasicAuthHeader()` from `lib/auth.ts`
- Reads JSON body from the incoming request
- Forwards to `${NEXT_PUBLIC_API_URL}/transactions/paid` with `Authorization` and `Content-Type` headers
- Returns backend response (success or error status)

### Step 4: Modify `services/transaction-service.ts`

- `getTransactionsByYearAndMonth` → change URL to `/api/transactions/${year}/${month}` (relative, hits Next.js API route)
- `savePaidTransaction` → change URL to `/api/transactions/paid` (relative)
- `healthCheck` → **no change** (keeps direct backend call without auth)
- Remove cache-control headers from service (moved to API route)

### Step 5: Update tests

| File | Action |
|------|--------|
| `lib/auth.test.ts` | **Create** — test correct header generation; test throws when env vars missing |
| `services/transaction-service.test.ts` | **Modify** — update URL assertions to `/api/transactions/...`; remove cache header assertions |
| `app/api/transactions/[year]/[month]/route.test.ts` | **Create** — test auth header is sent, data forwarded, error handling |
| `app/api/transactions/paid/route.test.ts` | **Create** — test auth header is sent, body forwarded, error handling |

Existing hook tests (`use-transactions.test.tsx`, `use-expense-selections.test.tsx`) mock the service module and should not need changes.

### Step 6: Update configuration

- **`.env.example`** — add `SPLITTER_USER=` and `SPLITTER_PWD=` with documentation comments
- **`Dockerfile`** — add comments documenting that `SPLITTER_USER` and `SPLITTER_PWD` must be provided at container runtime (these are NOT build args)

---

## Files Summary

| File | Action |
|------|--------|
| `lib/auth.ts` | Create |
| `lib/auth.test.ts` | Create |
| `app/api/transactions/[year]/[month]/route.ts` | Create |
| `app/api/transactions/[year]/[month]/route.test.ts` | Create |
| `app/api/transactions/paid/route.ts` | Create |
| `app/api/transactions/paid/route.test.ts` | Create |
| `services/transaction-service.ts` | Modify |
| `services/transaction-service.test.ts` | Modify |
| `.env.example` | Modify |
| `Dockerfile` | Modify |

## Verification

1. Run `npm run test` — all existing and new tests pass
2. Run `npm run lint` and `npm run type-check` — no errors
3. Set `SPLITTER_USER` and `SPLITTER_PWD` in `.env.local`, run `npm run dev`, and verify transactions load correctly
4. Unset the env vars and verify the app returns a 500 error (not a silent failure)
5. Verify `healthCheck` still works without credentials

---

## Refinement

**Q: Should credentials be server-side only or client-side (NEXT_PUBLIC_)?**
A: Server-side only. Create Next.js API route proxies to keep credentials off the browser.

**Q: What should happen if SPLITTER_USER or SPLITTER_PWD are not set?**
A: Fail with a clear error (HTTP 500 from the API route). Do not silently call without auth.

**Q: Should healthCheck include the auth header?**
A: No, data endpoints only.
