# Feature 3: Handle Negative Transactions (Refunds & Cashbacks)

## Context

Transactions with a negative `amount` represent refunds and cashbacks (e.g. a £5 refund from Sainsbury's comes through as `amount: -5.00`). Today, `app/transactions/page.tsx` uses `Math.abs(amount)` when computing the shared-expense **balance** (lines 148–161), so a refund *increases* what the counterparty owes instead of *decreasing* it.

### Concrete bug (from the spec)

```json
{ "date": "02/02/2026", "amount": -5.00, "paidBy": "Split",
  "originallyPaidBy": "Roland", "source": "Amex" }
```

- **Expected:** Chris's "still owes" goes **down** by £2.50.
- **Actual:** Chris's "still owes" goes **up** by £2.50 (`Math.abs(-5) / 2`).

### Scope

- **In scope:**
  - Fix signed-amount handling in the balance calculation (`app/transactions/page.tsx`).
  - Display negative amounts as `-£X.XX` in red in the transaction row and the summary totals.
  - Extend `AddTransactionPopup` to accept negative Custom amounts (regex already allows it; `formatAmount` and tests need updating).
  - Update unit/integration tests (`page.test.tsx`, `add-transaction-popup.test.tsx`) and add a Cypress e2e.
  - Update stale fixtures in `tests/fixtures/transactions.ts` to match the new sign convention (positive = charge, negative = refund/cashback).
  - Add a bullet to README Features.
- **Out of scope:** Backend changes; any refund-specific UI affordance beyond sign + colour; migration of historical data.

---

## Implementation Plan

### Step 1: Fix balance calculation — `app/transactions/page.tsx`

In the `useMemo` at lines ~109–181, replace the `Math.abs(amount)` branch (lines 148–161) with signed arithmetic:

```ts
// Negative amounts represent refunds/cashbacks and should reduce the debt.
if (paidBy === 'Split') {
  if (originallyPaidBy === 'Roland') {
    chrisOwes += amount / 2;
  } else if (originallyPaidBy === 'Chris') {
    rolandOwes += amount / 2;
  }
} else if (paidBy === 'Chris' && originallyPaidBy === 'Roland') {
  chrisOwes += amount;
} else if (paidBy === 'Roland' && originallyPaidBy === 'Chris') {
  rolandOwes += amount;
}
```

Also remove the now-misleading inline comment on line 149. The `netBalance = chrisOwes - rolandOwes` logic and the sign-flip for "Roland still owes" already handle the case where refunds flip the direction (confirmed in refinement).

### Step 2: Display negative amounts as `-£X.XX` in red

Per refinement decision.

- **Transaction row** (lines ~323–333): change `£{Math.abs(transaction.amount).toFixed(2)}` to a helper that emits `-£5.00` when the amount is negative and `£20.00` otherwise, keeping the red colour on negatives.
- **Summary totals** (lines 232–253): apply the same rule — drop `Math.abs(...)` on the displayed string and keep the sign. The existing `>= 0 ? green : red` colour logic continues to work.

Extract a tiny helper in the same file (or a new `lib/format-amount.ts` if preferred) — e.g.:

```ts
function formatSignedAmount(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}£${Math.abs(value).toFixed(2)}`;
}
```

### Step 3: Unit / integration tests — `app/transactions/page.test.tsx`

Add new cases under `describe('TransactionsPage Shared Expenses & Balance', …)`:

| Case | Input | Expected |
|---|---|---|
| Refund on Split (Roland-paid) reduces Chris's debt | A: `{amount: 20, Split, Roland}`, B: `{amount: -5, Split, Roland}` | `Chris still owes £7.50` |
| Refund on Split (Chris-paid) reduces Roland's debt | A: `{amount: 20, Split, Chris}`, B: `{amount: -5, Split, Chris}` | `Roland still owes £7.50` |
| Refund assigned entirely to Chris (originally Roland) reduces what Chris owes | `{amount: 20, Chris, Roland}`, `{amount: -10, Chris, Roland}` | `Chris still owes £10.00` |
| Refunds exceed charges → balance flips | `{amount: 4, Split, Roland}`, `{amount: -10, Split, Roland}` | `Roland still owes £3.00` |
| Pure refund month | single `{amount: -10, Split, Roland}` | `Roland still owes £5.00` |
| Negative amount renders as `-£5.00` | single `{amount: -5, Split, Roland}` | transaction row text contains `-£5.00` |
| Negative source total renders with sign | mix yielding `Amex` source total of `-£3.00` | summary Amex row contains `-£3.00` |

Keep the existing spec-example test green — its inputs are all positive so behaviour is unchanged.

### Step 4: AddTransactionPopup — allow negative Custom amounts

**`components/features/add-transaction-popup.tsx`:**

- `formatAmount` (line 20) currently uses `/^\d+$/` and `/^\d+\.\d$/`, which silently skip zero-padding for negative inputs like `-5`. Update to `/^-?\d+$/` and `/^-?\d+\.\d$/` so `-5` → `-5.00` and `-5.7` → `-5.70`.
- No regex change needed on the `register('amount', { pattern: … })` call — `/^-?\d+(\.\d{1,2})?$/` already accepts the minus sign.
- Consider a small helper text under the input: "Use a negative amount for refunds (e.g. -5.00)". Optional; to be confirmed during implementation if wanted.

**`components/features/add-transaction-popup.test.tsx`:**

- Add a case: submitting `-5` populates the form and dispatches `saveTransaction.mutate` with `amount: '-5.00'` (zero-padded).
- Add a case: submitting an invalid `--5` triggers the existing validation error.

### Step 5: E2E test — `tests/e2e/transactions.cy.ts` + fixture

`cypress.config.ts` sets `fixturesFolder: 'tests/fixtures'`, so the Cypress fixture file should live at `tests/fixtures/transactions-with-refund.json`. `cy.fixture('transactions-with-refund')` resolves to that path automatically.

The spec stubs `GET /api/transactions/*/*` to return a month with one charge and one refund, then asserts:

- The refund row displays `-£5.00`.
- The summary balance section reflects the refund-reduced amount (e.g. `Chris still owes £7.50`).
- (Optional) the refund amount cell has red text.

### Step 6: Update test fixtures — `tests/fixtures/transactions.ts`

Per refinement: update `mockTransactions` to the new convention (positive = charge, negative = refund).

- Flip `-125.50 GROCERY STORE` and `-45.00 RESTAURANT` to positive amounts (they are charges).
- Flip `-5.75 COFFEE SHOP` (in `mockSingleTransaction`) to positive.
- The `+500.00 PAYMENT RECEIVED` row was a card-balance payment, not an expense — keep it but re-describe if needed, or drop it (low-value for tests).
- Add a new `mockTransactionsWithRefund` export that includes one positive charge + one negative refund for shared use across unit and e2e tests where sensible (the Cypress fixture is a separate JSON file to match Cypress idioms).

Run the full test suite after the fixture flip; any assertion that depended on the old negative values for charges will need to be updated.

### Step 7: README update — `README.md`

Append one bullet under **Features**:

> - **Refunds & Cashbacks**: Negative transaction amounts (refunds, cashbacks) are respected as signed values — they reduce the balance owed and render as `-£X.XX` in red.

### Step 8: Dockerfile

**No change required.** Pure client-side logic; no new env vars, packages, or build steps. Called out explicitly so reviewers don't assume it was forgotten.

---

## Files Summary

| File | Action |
|------|--------|
| `app/transactions/page.tsx` | Modify (Steps 1 + 2) |
| `app/transactions/page.test.tsx` | Modify (Step 3 cases) |
| `components/features/add-transaction-popup.tsx` | Modify (Step 4 — `formatAmount` fix) |
| `components/features/add-transaction-popup.test.tsx` | Modify (Step 4 test cases) |
| `tests/fixtures/transactions.ts` | Modify (Step 6 — sign convention) |
| `tests/fixtures/transactions-with-refund.json` | Create (Cypress fixture) |
| `tests/e2e/transactions.cy.ts` | Modify (Step 5 spec) |
| `README.md` | Modify (Step 7) |
| `Dockerfile` | No change (explicit) |

## Verification

1. `npm run test` — all tests pass, including the new balance and popup cases.
2. `npm run type-check` and `npm run lint` — clean.
3. `npm run dev`, then for a month with a refund: balance reduces, refund row shows `-£X.XX` in red.
4. `npx cypress run` — e2e passes.
5. Manually add a Custom transaction with amount `-5` via the popup and confirm it persists and renders correctly.

---

## Refinement

**Q1: Under the current data feed, what does a negative Amex amount mean?**
A: **Only refunds/cashbacks are negative.** Regular Amex charges now come through as positive; negatives are exclusively refunds/cashbacks. The fix (drop `Math.abs`) is therefore directly correct. The old inline comment *"Amex charges are negative, custom expenses are positive"* is stale and will be removed.

**Q2: Display format for negative amounts?**
A: **`-£5.00` in red.** Explicit minus sign plus red colour. Applies to the transaction row cell and to the summary totals (All + per-source). Introduces a `formatSignedAmount` helper; remove `Math.abs(...)` from the displayed strings.

**Q3: When refunds exceed charges for one person, how should the balance render?**
A: **Flip direction automatically.** If Chris's computed owes goes negative, show `Roland still owes £X`. The existing `netBalance`/`Math.abs(netBalance)` flip in `page.tsx` already handles this — no new code needed.

**Q4: Should AddTransactionPopup accept negative Custom amounts?**
A: **In scope — allow negatives.** The `register` regex (`/^-?\d+(\.\d{1,2})?$/`) already permits `-`, but `formatAmount` zero-pads only positive patterns. Update `formatAmount` to handle negatives, and add unit tests covering the negative-input path.

**Q5: What to do with the stale `mockTransactions` fixture (charges stored as negative)?**
A: **Update to the new convention.** Flip the existing Amex charges to positive amounts so the fixture is consistent with current reality. Run the test suite afterwards and fix any assertions that encoded the old sign.

**Q6: Where should the Cypress refund fixture live?**
A: User selected *"cypress/fixtures/ (Cypress default)"*, but the project's `cypress.config.ts` remaps `fixturesFolder` to `tests/fixtures`. Placing the file at `tests/fixtures/transactions-with-refund.json` keeps the Cypress `cy.fixture('transactions-with-refund')` shorthand working without any plumbing. This is functionally equivalent to the user's intent and respects existing project layout. Flag if this interpretation is wrong.
