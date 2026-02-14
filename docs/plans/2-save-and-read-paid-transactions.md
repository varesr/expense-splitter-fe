# Feature 2: Save and Read Paid Transactions via Backend API

## Context

Currently, "paid by" selections for transactions are stored in the browser's localStorage. This means selections are lost when switching browsers/devices and aren't shared. The backend API now supports reading and writing paid transaction data. This feature migrates from localStorage to the backend API, making selections persistent and server-authoritative.

## Scope

- Replace localStorage writes with `PUT /api/transactions/paid` API calls
- Read `paidBy` from the GET transaction response instead of localStorage
- Remove localStorage persistence code
- Add error handling with toast notifications on save failure
- No migration of existing localStorage data (start fresh)

## Implementation Plan

### Step 1: Update Transaction type
**File:** `types/transaction.ts`
- Add optional `paidBy?: PaidBy | null` to `Transaction` interface
- Add `PaidTransactionRequest` interface with `key: string` and `paidBy: string`

### Step 2: Add `savePaidTransaction` to API service
**File:** `services/transaction-service.ts`
- Add `savePaidTransaction(key, paidBy)` method: `PUT /api/transactions/paid`
- Returns void (204), throws on 400/500
- Follow existing service pattern (same error handling style)

### Step 3: Remove localStorage functions
**File:** `lib/expense-selection-storage.ts`
- Remove `saveSelection()` and `getSelection()` functions
- Keep `generateStorageKey()`, `parseDateString()`, `createIdentifierFromTransaction()`, `isValidPaidBy()` (still needed for key generation)

### Step 4: Create Toast component
**File:** `components/ui/toast.tsx` (NEW)
- Minimal error toast: fixed bottom-right, red background, dismiss button, auto-dismiss after 5s
- `role="alert"` for accessibility

### Step 5: Rewrite `useExpenseSelections` hook
**File:** `hooks/use-expense-selections.ts` (major rewrite)
- **Read:** `getSelectionForTransaction` reads `transaction.paidBy`, defaults to `'Roland'`
- **Write:** `setSelectionForTransaction` triggers a TanStack Query `useMutation` calling `savePaidTransaction`
- **Optimistic update:** Immediately update query cache `['transactions', year, month]`; revert on error
- **Error state:** Expose `error` and `clearError` for toast display
- **New parameters:** Hook now takes `(transactions, year, month)` instead of just `(transactions)`

### Step 6: Update Transactions page
**File:** `app/transactions/page.tsx`
- Pass `year` and `month` to `useExpenseSelections`
- Destructure `error` and `clearError` from hook
- Render `<Toast>` when error is present
- No other logic changes needed (hook interface stays compatible)

### Step 7: Update tests

| Test File | Changes |
|-----------|---------|
| `services/transaction-service.test.ts` | Add tests for `savePaidTransaction` (success, 400, 500) |
| `lib/expense-selection-storage.test.ts` | Remove `saveSelection`/`getSelection` tests, keep key util tests |
| `hooks/use-expense-selections.test.tsx` | Rewrite: use QueryClient wrapper, mock service, test optimistic update + revert |
| `app/transactions/page.test.tsx` | Mock transaction service, add toast error test |
| `components/ui/toast.test.tsx` (NEW) | Test render, dismiss, auto-dismiss |
| `tests/fixtures/transactions.ts` | Add `paidBy: null` to mock data |
| `tests/e2e/transactions.cy.ts` | Intercept PUT calls, test error toast |

### Implementation Order
1. `types/transaction.ts`
2. `services/transaction-service.ts` + test
3. `lib/expense-selection-storage.ts` + test cleanup
4. `components/ui/toast.tsx` + test
5. `hooks/use-expense-selections.ts` + test
6. `tests/fixtures/transactions.ts`
7. `app/transactions/page.tsx` + test
8. `tests/e2e/transactions.cy.ts`

Run `npm run test` after each step.

## Verification

1. Run `npm run type-check` -- no type errors
2. Run `npm run test` -- all tests pass
3. Run `npm run lint` -- no lint errors
4. Manual test: Start dev server, select a paid-by value, verify PUT request in Network tab
5. Manual test: Reload page, verify selection persists from API response
6. Manual test: Simulate API failure (stop backend), verify toast appears and selection reverts

## Refinement

**Q: The API swagger shows unpadded key format (`expense-selection:2025:8:9:34.20`) but current code uses padded format (`expense-selection:2025:08:09:34.20`). Which to use?**
A: Use the current padded format. The backend accepts it.

**Q: The swagger PaidBy examples are lowercase ('shared', 'mine', 'partner'). The frontend uses 'Roland', 'Split', 'Chris'. Should we map values?**
A: No mapping needed. The backend accepts whatever string is sent; it stores the frontend values as-is.

**Q: How should the UI handle PUT failures?**
A: Show a toast notification with error message and revert the selection in the UI (optimistic update rollback).

**Q: Should we migrate existing localStorage selections to the backend?**
A: No migration. Start fresh with the API. Existing localStorage selections will be ignored.