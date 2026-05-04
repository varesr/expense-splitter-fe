# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Assistant Guidelines

1. **Plan first** - For new features always make a plan first and ask for user confirmation before executing
2. **Write tests** for new features and bug fixes
3. **Update types** when modifying data structures
4. **Do not change styling/color theme** unless explicitly asked
5. **Do not change AI assistant Guidelines** - Never change this section

## Commands

```bash
# Development
npm run dev                          # Start dev server (localhost:3000)
npm run build                        # Production build
npm run type-check                   # TypeScript checking (tsc --noEmit)

# Testing
npm test                             # Run all unit/integration tests (Vitest)
npm test <pattern>                   # Run tests matching pattern (e.g. npm test transaction-filter)
npm run test:watch                   # Watch mode
npm run test:coverage                # Coverage report
npm run test:e2e                     # Open Cypress E2E runner (dev server must be running)
npx cypress run                      # Headless Cypress E2E

# Code quality
npm run lint                         # ESLint
npm run format                       # Prettier (writes in place)
```

## Architecture Overview

This is an expense-splitting frontend (Next.js 15, App Router) that talks to a backend API at `NEXT_PUBLIC_API_URL` (default `http://localhost:7272`). Two users (Roland and Chris) track shared expenses and assign who paid for each transaction.

### Request Flow

```
Services (fetch + credentials) → Custom Hooks (TanStack Query) → Components
```

- **`lib/api-client.ts`** — Centralized fetch wrapper. Always sends `credentials: 'include'`. Auto-clears `auth_status` cookie and redirects to `/login` on 401.
- **`services/`** — Thin wrappers around api-client for each domain (auth, transactions).
- **`hooks/`** — TanStack Query hooks that consume services. All server state goes through here.
- **`components/`** — React components, split into `ui/` (generic), `features/` (domain), `layouts/`.

### Authentication

Cookie-based sessions via the backend. The `auth_status` cookie is the gate.

- **`middleware.ts`** — Runs on every non-static request. No `auth_status` cookie → redirect to `/login`. Has cookie + on `/login` → redirect to `/`.
- **`services/auth-service.ts`** — `login()`, `logout()`, `me()` endpoints under `/auth/*`.
- **`hooks/use-auth.ts`** — `useLogin()`, `useLogout()`, `useCurrentUser()` hooks. Logout clears the entire query cache.
- **`components/layouts/auth-header.tsx`** — Displays current user's name and sign-out button.

### Transaction Feature

The core feature: view monthly transactions and assign who paid.

- **Filter**: `TransactionFilterForm` (year/month dropdowns via react-hook-form) → `useTransactions(year, month)` → `GET /transactions/{year}/{month}`
- **"Paid By" selection**: Each row has a `ToggleButtonGroup` with options: Roland, Split, Chris.
  - Selecting calls `useExpenseSelections().setSelectionForTransaction()` → `PUT /transactions/paid` with optimistic cache update and rollback on error.
  - Storage key format: `expense-selection:{year}:{month:2d}:{day:2d}:{amount:fixed2}` (generated in `lib/expense-selection-storage.ts`)
- **Totals**: Computed in `useMemo` on the transactions page — Roland's total, Chris's total, with Split amounts divided 50/50.

### Key Types (`types/`)

```typescript
type PaidBy = 'Roland' | 'Split' | 'Chris';

interface Transaction {
  date: string;           // DD/MM/YYYY
  description: string;
  cardMember: string;
  accountNumber: string;
  amount: number;
  paidBy?: PaidBy | null;
}
```

### TanStack Query Configuration (`lib/query-provider.tsx`)

- Default staleTime: 5 minutes
- `refetchOnWindowFocus: false`
- Query keys: `['transactions', year, month]`, `['currentUser']`, `['health']`

## Tech Stack

- **Next.js 15** (App Router) + **React 18** + **TypeScript** (strict)
- **TanStack Query 5** for server state
- **React Hook Form** for forms
- **Tailwind CSS 3** with custom green primary theme (#16a34a)
- **Vitest** + **React Testing Library** for unit/integration tests
- **Cypress 15** for E2E tests

## Project Layout

```
app/                    # Pages: layout.tsx, page.tsx, login/, transactions/
components/ui/          # ToggleButtonGroup, Toast
components/features/    # TransactionFilterForm, AddTransactionPopup
components/layouts/     # AuthHeader
hooks/                  # use-auth, use-transactions, use-expense-selections, use-save-transaction
services/               # auth-service, transaction-service
lib/                    # api-client, query-provider, expense-selection-storage
types/                  # auth.ts, transaction.ts
middleware.ts           # Auth route protection
tests/                  # setup.ts, fixtures/, e2e/
```

Unit tests are co-located with source files (`*.test.tsx`). E2E tests live in `tests/e2e/*.cy.ts`.

## Environment

Copy `.env.example` to `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:7272
```

Docker runs on port 7273 and uses `host.docker.internal:7272` to reach the backend.
