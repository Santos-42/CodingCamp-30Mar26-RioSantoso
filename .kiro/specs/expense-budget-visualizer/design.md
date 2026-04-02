# Design Document: Expense & Budget Visualizer

## Overview

A single-page, mobile-first web application for tracking personal spending. The app is entirely client-side — no server, no build step, no dependencies. It is delivered as a static `index.html` that links one CSS file and one JS file.

Core capabilities:
- Add and delete spending transactions (name, amount, category)
- View a scrollable transaction history
- See a live-updating balance total
- Visualize spending by category via a canvas-drawn pie chart
- Persist all data in `localStorage`

The architecture is deliberately minimal: a single module of vanilla JS manages state, DOM rendering, storage, and chart drawing. No virtual DOM, no reactive framework — just direct DOM manipulation driven by a central state object.

---

## Architecture

The app follows a simple **state → render** cycle:

```
User Action
    │
    ▼
State Mutation (addTransaction / deleteTransaction)
    │
    ▼
Persist to localStorage
    │
    ▼
Re-render UI (list + balance + chart)
```

All state lives in a single in-memory array (`transactions`). Every mutation (add/delete) immediately persists the full array to `localStorage`, then triggers a full re-render of the three UI regions. There is no partial update — re-rendering is cheap enough for the expected data volume.

### File Structure

```
index.html          ← single HTML entry point
css/
  style.css         ← all styles (responsive, layout, components)
js/
  app.js            ← all application logic
```

---

## Components and Interfaces

### HTML Structure (`index.html`)

```
<body>
  <header>
    <h1>Expense Tracker</h1>
    <div id="balance-display">Total: $0.00</div>
  </header>

  <main>
    <section id="form-section">
      <form id="transaction-form">
        <input id="item-name" type="text" placeholder="Item name" />
        <input id="item-amount" type="number" min="0.01" step="0.01" placeholder="Amount" />
        <select id="item-category">
          <option value="">Select category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Fun">Fun</option>
        </select>
        <button type="submit">Add</button>
        <div id="form-errors" aria-live="polite"></div>
      </form>
    </section>

    <section id="chart-section">
      <canvas id="pie-chart" width="300" height="300"></canvas>
      <div id="chart-placeholder">No transactions yet</div>
    </section>

    <section id="list-section">
      <ul id="transaction-list"></ul>
    </section>
  </main>
</body>
```

### JavaScript Module (`js/app.js`)

The JS file is structured as an IIFE (or top-level module) with these logical sections:

#### State

```js
let transactions = [];  // Array<Transaction>
```

#### Storage Interface

| Function | Signature | Description |
|---|---|---|
| `loadFromStorage()` | `() → Transaction[]` | Reads and parses `localStorage`. Returns `[]` on error. |
| `saveToStorage(txns)` | `(Transaction[]) → void` | Serializes and writes to `localStorage`. |

#### Validator

| Function | Signature | Description |
|---|---|---|
| `validate(name, amount, category)` | `(string, string, string) → string[]` | Returns array of error messages. Empty array = valid. |

#### State Mutations

| Function | Signature | Description |
|---|---|---|
| `addTransaction(name, amount, category)` | `(string, number, string) → void` | Creates transaction, pushes to state, persists, re-renders. |
| `deleteTransaction(id)` | `(string) → void` | Filters state by id, persists, re-renders. |

#### Renderers

| Function | Signature | Description |
|---|---|---|
| `renderAll()` | `() → void` | Calls `renderList()`, `renderBalance()`, `renderChart()`. |
| `renderList()` | `() → void` | Rebuilds `#transaction-list` from `transactions`. |
| `renderBalance()` | `() → void` | Updates `#balance-display` text. |
| `renderChart()` | `() → void` | Draws pie chart on `<canvas>` or shows placeholder. |

#### Chart Drawing

`renderChart()` uses the Canvas 2D API directly. No third-party chart library.

Algorithm:
1. Aggregate `transactions` by category → `{ Food: n, Transport: n, Fun: n }`
2. If all totals are 0, show placeholder div, hide canvas.
3. Otherwise, hide placeholder, show canvas.
4. For each category with spend > 0, draw an arc proportional to its share of total.
5. Draw category label + percentage text near each segment midpoint.

#### Event Wiring

- `#transaction-form` `submit` → validate → addTransaction or show errors
- `#transaction-list` delegated `click` on `.delete-btn` → deleteTransaction
- `DOMContentLoaded` → loadFromStorage → renderAll (+ show storage warning if load failed)

---

## Data Models

### Transaction

```js
{
  id: string,        // crypto.randomUUID() or Date.now().toString() fallback
  name: string,      // item name, non-empty
  amount: number,    // positive float, stored as number
  category: string   // "Food" | "Transport" | "Fun"
}
```

### localStorage Schema

Key: `"expense_transactions"`  
Value: JSON-serialized `Transaction[]`

```json
[
  { "id": "1720000000000", "name": "Coffee", "amount": 3.50, "category": "Food" },
  { "id": "1720000001000", "name": "Bus fare", "amount": 2.00, "category": "Transport" }
]
```

On load, the app calls `JSON.parse()` inside a `try/catch`. If parsing fails or the result is not an array, the app falls back to `[]` and shows a non-blocking warning banner.

### Category Aggregation (runtime, not persisted)

```js
{
  Food: number,       // sum of amounts for Food transactions
  Transport: number,  // sum of amounts for Transport transactions
  Fun: number         // sum of amounts for Fun transactions
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid transaction add round-trip

*For any* valid transaction (non-empty name, positive amount, valid category), calling `addTransaction` should result in the transaction appearing in the in-memory `transactions` array and in the value returned by `loadFromStorage()`.

**Validates: Requirements 1.2, 6.1**

---

### Property 2: Form resets after valid submission

*For any* valid form submission, after `addTransaction` completes, all form fields (name, amount, category) should be reset to their default empty/placeholder state.

**Validates: Requirements 1.3**

---

### Property 3: Validator rejects empty fields

*For any* combination of inputs where one or more fields (name, amount, category) are empty or missing, `validate()` should return a non-empty array of error messages and no transaction should be added.

**Validates: Requirements 1.4**

---

### Property 4: Validator rejects non-positive amounts

*For any* amount value that is zero, negative, NaN, or non-numeric, `validate()` should return an error message referencing the amount field.

**Validates: Requirements 1.5**

---

### Property 5: List renders all transaction fields

*For any* array of transactions passed to `renderList()`, every rendered list item should contain the transaction's name, formatted amount, and category.

**Validates: Requirements 2.1, 3.1**

---

### Property 6: Storage round-trip preserves transactions

*For any* array of transactions, calling `saveToStorage(txns)` followed by `loadFromStorage()` should return an array deeply equal to the original.

**Validates: Requirements 2.3, 6.3**

---

### Property 7: Delete removes from state and storage

*For any* transaction present in `transactions`, calling `deleteTransaction(id)` should result in that transaction being absent from both the in-memory array and the value returned by `loadFromStorage()`.

**Validates: Requirements 3.2, 6.2**

---

### Property 8: Balance equals sum of all amounts

*For any* array of transactions, the value rendered by `renderBalance()` (parsed back to a number) should equal the arithmetic sum of all transaction amounts, rounded to two decimal places.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

---

### Property 9: Chart segments match categories with spend

*For any* array of transactions, the category aggregation produced for the chart should contain exactly the categories that have a total spend greater than zero, and no others.

**Validates: Requirements 5.1, 5.3, 5.4, 5.5**

---

### Property 10: Chart label data includes name and percentage

*For any* non-empty category aggregation, each entry in the label data array should include the category name string and a percentage value between 0 and 100 (inclusive) that sums to 100 across all entries.

**Validates: Requirements 5.2**

---

### Property 11: Malformed storage falls back to empty array

*For any* string that is not valid JSON, or any JSON value that is not an array, `loadFromStorage()` should return an empty array without throwing.

**Validates: Requirements 6.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Empty name field | `validate()` returns `["Item name is required."]`; form not submitted |
| Empty amount field | `validate()` returns `["Amount is required."]`; form not submitted |
| Amount ≤ 0 or non-numeric | `validate()` returns `["Amount must be a positive number."]`; form not submitted |
| No category selected | `validate()` returns `["Please select a category."]`; form not submitted |
| `localStorage` unavailable (SecurityError) | `loadFromStorage()` catches exception, returns `[]`, sets a flag to show warning banner |
| `localStorage` contains malformed JSON | `JSON.parse` inside `try/catch` returns `[]`, sets warning flag |
| `localStorage` contains non-array JSON | Type check after parse returns `[]`, sets warning flag |
| `crypto.randomUUID` unavailable | Falls back to `Date.now().toString() + Math.random()` for id generation |

Error messages are rendered into `#form-errors` (an `aria-live="polite"` region) so screen readers announce them. The storage warning is a dismissible banner injected at the top of `<main>`.

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- Unit tests cover specific examples, integration points, and edge cases.
- Property tests verify universal correctness across randomized inputs.

### Property-Based Testing

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, no build required when loaded via CDN in a test HTML harness, or via `npm` in a Node test runner).

Each property test runs a **minimum of 100 iterations**.

Each test is tagged with a comment in the format:
`// Feature: expense-budget-visualizer, Property N: <property text>`

| Property | Test Description | fast-check Arbitraries |
|---|---|---|
| P1 | Add then read from storage returns same transaction | `fc.string()`, `fc.float({min:0.01})`, `fc.constantFrom("Food","Transport","Fun")` |
| P2 | Form fields are empty after valid add | Same as P1 |
| P3 | validate() returns errors for any empty field combo | `fc.subarray(["name","amount","category"], {minLength:1})` |
| P4 | validate() returns error for any non-positive amount | `fc.oneof(fc.constant(0), fc.float({max:0}), fc.constant(NaN), fc.string())` |
| P5 | renderList() output contains name, amount, category for every transaction | `fc.array(transactionArbitrary)` |
| P6 | saveToStorage then loadFromStorage returns equal array | `fc.array(transactionArbitrary)` |
| P7 | deleteTransaction removes from state and storage | `fc.array(transactionArbitrary, {minLength:1})` + pick random index |
| P8 | Balance text parsed equals sum of amounts | `fc.array(transactionArbitrary)` |
| P9 | Aggregation keys match categories with spend > 0 | `fc.array(transactionArbitrary)` |
| P10 | Label percentages sum to 100 and include category name | `fc.array(transactionArbitrary, {minLength:1})` |
| P11 | loadFromStorage returns [] for any non-array JSON or invalid string | `fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))` |

### Unit Tests

Unit tests use a simple assertion helper (no framework needed) or a lightweight runner like [uvu](https://github.com/lukeed/uvu).

Focus areas:
- `validate()` with specific known-bad inputs (empty string, `"0"`, `"-5"`, `"abc"`)
- `renderBalance()` with `[]` renders `"$0.00"` (edge case for Requirement 4.4)
- `renderChart()` with `[]` shows placeholder and hides canvas (edge case for Requirement 5.5)
- `loadFromStorage()` with `"not json"` returns `[]` (edge case for Requirement 6.4)
- `loadFromStorage()` with `"{}"` (object, not array) returns `[]`
- Form submission integration: fill fields → submit → check list length and storage

### Test File Location

```
tests/
  unit.test.js       ← unit tests (uvu or plain assertions)
  property.test.js   ← property-based tests (fast-check)
  test.html          ← browser harness to run both in-browser if desired
```
