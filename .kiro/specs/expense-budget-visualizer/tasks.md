# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a single-page, client-side expense tracker using HTML, CSS, and vanilla JavaScript. The app manages transactions in memory, persists them to `localStorage`, and re-renders the list, balance, and pie chart on every state change.

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html` with the full HTML structure: `<header>` with `#balance-display`, `<form id="transaction-form">` with `#item-name`, `#item-amount`, `#item-category`, `#form-errors`, `<canvas id="pie-chart">`, `#chart-placeholder`, and `<ul id="transaction-list">`
  - Create empty `css/style.css` and `js/app.js` files and link them from `index.html`
  - Add `aria-live="polite"` to `#form-errors` for screen reader support
  - _Requirements: 1.1, 8.1, 8.2, 8.3_

- [x] 2. Implement storage and data model
  - [x] 2.1 Implement `loadFromStorage()` and `saveToStorage(txns)` in `js/app.js`
    - `loadFromStorage()` reads `"expense_transactions"` from `localStorage`, parses JSON inside `try/catch`, validates result is an array, returns `[]` and sets a warning flag on any failure
    - `saveToStorage(txns)` serializes the array and writes it to `localStorage`
    - Add `crypto.randomUUID()` with `Date.now().toString() + Math.random()` fallback for id generation
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.2 Write property test for storage round-trip (Property 6)
    - **Property 6: Storage round-trip preserves transactions**
    - **Validates: Requirements 2.3, 6.3**
    - Use `fc.array(transactionArbitrary)` in `tests/property.test.js`

  - [ ]* 2.3 Write property test for malformed storage fallback (Property 11)
    - **Property 11: Malformed storage falls back to empty array**
    - **Validates: Requirements 6.4**
    - Use `fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))` in `tests/property.test.js`

- [x] 3. Implement form validation
  - [x] 3.1 Implement `validate(name, amount, category)` in `js/app.js`
    - Returns an array of error strings; empty array means valid
    - Checks: name non-empty, amount non-empty, amount is a positive number (rejects 0, negative, NaN, non-numeric), category is one of the three valid values
    - _Requirements: 1.4, 1.5_

  - [ ]* 3.2 Write property test for empty-field rejection (Property 3)
    - **Property 3: Validator rejects empty fields**
    - **Validates: Requirements 1.4**
    - Use `fc.subarray(["name","amount","category"], {minLength:1})` in `tests/property.test.js`

  - [ ]* 3.3 Write property test for non-positive amount rejection (Property 4)
    - **Property 4: Validator rejects non-positive amounts**
    - **Validates: Requirements 1.5**
    - Use `fc.oneof(fc.constant(0), fc.float({max:0}), fc.constant(NaN), fc.string())` in `tests/property.test.js`

  - [ ]* 3.4 Write unit tests for `validate()` with known-bad inputs
    - Test empty string, `"0"`, `"-5"`, `"abc"` for amount field
    - Test missing name and missing category
    - _Requirements: 1.4, 1.5_

- [x] 4. Implement state mutations and rendering
  - [x] 4.1 Implement `addTransaction(name, amount, category)` and `deleteTransaction(id)`
    - `addTransaction`: creates a `Transaction` object with generated id, pushes to `transactions`, calls `saveToStorage`, calls `renderAll()`
    - `deleteTransaction`: filters `transactions` by id, calls `saveToStorage`, calls `renderAll()`
    - _Requirements: 1.2, 3.2, 6.1, 6.2_

  - [x] 4.2 Implement `renderList()` in `js/app.js`
    - Rebuilds `#transaction-list` from the `transactions` array
    - Each `<li>` shows item name, formatted amount, category, and a delete button with class `delete-btn` and a `data-id` attribute
    - _Requirements: 2.1, 3.1_

  - [ ]* 4.3 Write property test for list rendering (Property 5)
    - **Property 5: List renders all transaction fields**
    - **Validates: Requirements 2.1, 3.1**
    - Use `fc.array(transactionArbitrary)` in `tests/property.test.js`

  - [x] 4.4 Implement `renderBalance()` in `js/app.js`
    - Sums all `transaction.amount` values, formats to two decimal places with `$` prefix, updates `#balance-display`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.5 Write property test for balance calculation (Property 8)
    - **Property 8: Balance equals sum of all amounts**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    - Use `fc.array(transactionArbitrary)` in `tests/property.test.js`

  - [ ]* 4.6 Write unit test for `renderBalance()` with empty array renders `$0.00`
    - Edge case for Requirement 4.4
    - _Requirements: 4.4_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement pie chart rendering
  - [x] 6.1 Implement category aggregation logic and `renderChart()` in `js/app.js`
    - Aggregate `transactions` by category into `{ Food: n, Transport: n, Fun: n }`
    - If all totals are 0: show `#chart-placeholder`, hide `<canvas>`
    - Otherwise: hide placeholder, show canvas, draw arcs proportional to each category's share using Canvas 2D API, draw category name + percentage label near each segment midpoint
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Write property test for chart category aggregation (Property 9)
    - **Property 9: Chart segments match categories with spend**
    - **Validates: Requirements 5.1, 5.3, 5.4, 5.5**
    - Use `fc.array(transactionArbitrary)` in `tests/property.test.js`

  - [ ]* 6.3 Write property test for chart label data (Property 10)
    - **Property 10: Chart label data includes name and percentage**
    - **Validates: Requirements 5.2**
    - Use `fc.array(transactionArbitrary, {minLength:1})` in `tests/property.test.js`

  - [ ]* 6.4 Write unit test for `renderChart()` with empty transactions shows placeholder
    - Edge case for Requirement 5.5
    - _Requirements: 5.5_

- [x] 7. Wire up event handlers and app initialization
  - [x] 7.1 Wire `#transaction-form` submit event in `js/app.js`
    - On submit: call `validate()`, if errors render them into `#form-errors`, else call `addTransaction()` and reset the form fields to default state
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ]* 7.2 Write property test for valid transaction add round-trip (Property 1)
    - **Property 1: Valid transaction add round-trip**
    - **Validates: Requirements 1.2, 6.1**
    - Use `fc.string()`, `fc.float({min:0.01})`, `fc.constantFrom("Food","Transport","Fun")` in `tests/property.test.js`

  - [ ]* 7.3 Write property test for form reset after valid submission (Property 2)
    - **Property 2: Form resets after valid submission**
    - **Validates: Requirements 1.3**
    - Use same arbitraries as Property 1 in `tests/property.test.js`

  - [x] 7.4 Wire delegated click handler on `#transaction-list` for `.delete-btn` in `js/app.js`
    - Reads `data-id` from the clicked button, calls `deleteTransaction(id)`
    - _Requirements: 3.2_

  - [ ]* 7.5 Write property test for delete removes from state and storage (Property 7)
    - **Property 7: Delete removes from state and storage**
    - **Validates: Requirements 3.2, 6.2**
    - Use `fc.array(transactionArbitrary, {minLength:1})` + pick random index in `tests/property.test.js`

  - [x] 7.6 Wire `DOMContentLoaded` initialization in `js/app.js`
    - Call `loadFromStorage()`, assign result to `transactions`, call `renderAll()`
    - If storage load failed (warning flag set), inject a dismissible warning banner at the top of `<main>`
    - _Requirements: 2.3, 4.4, 5.5, 6.3, 6.4_

  - [ ]* 7.7 Write unit test for form submission integration
    - Fill fields programmatically → dispatch submit → assert list length and storage content
    - _Requirements: 1.2, 6.1_

- [x] 8. Implement responsive CSS layout
  - Write `css/style.css` with mobile-first styles
  - Use CSS flexbox or grid so the layout is usable from 320px to 1920px without horizontal scrolling
  - Style the form, transaction list (scrollable container with `overflow-y: auto`), balance display, and chart section
  - _Requirements: 2.2, 7.1, 7.2_

- [x] 9. Create test infrastructure
  - Create `tests/unit.test.js` with a lightweight assertion helper or `uvu` runner for all unit tests
  - Create `tests/property.test.js` with `fast-check` loaded via `npm` or CDN for all property tests
  - Create `tests/test.html` as a browser harness that loads both test files
  - _Requirements: 8.3_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations each
- Each property test must include the comment: `// Feature: expense-budget-visualizer, Property N: <property text>`
- The `renderAll()` helper simply calls `renderList()`, `renderBalance()`, and `renderChart()` in sequence
