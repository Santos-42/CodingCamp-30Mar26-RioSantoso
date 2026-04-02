# Requirements Document

## Introduction

A mobile-friendly, standalone web application that helps users track daily spending. The app displays a running total balance, a scrollable transaction history, and a pie chart visualizing spending by category. All data is persisted client-side using the browser's Local Storage API. The app is built with HTML, CSS, and Vanilla JavaScript only — no frameworks, no build tools.

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single spending record consisting of an item name, a monetary amount, and a category.
- **Category**: One of three predefined spending labels: Food, Transport, or Fun.
- **Transaction_List**: The scrollable UI component that displays all recorded transactions.
- **Balance_Display**: The UI component at the top of the page that shows the current total of all transaction amounts.
- **Input_Form**: The UI form component containing fields for item name, amount, and category.
- **Chart**: The pie chart UI component that visualizes spending distribution across categories.
- **Storage**: The browser's Local Storage API used to persist transaction data.
- **Validator**: The client-side logic responsible for checking form input correctness before submission.

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to fill out a form with an item name, amount, and category, so that I can record a new spending transaction.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for item name, a numeric field for amount, and a dropdown selector for category containing the options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields filled and a valid positive amount, THE App SHALL add the transaction to the Transaction_List and persist it to Storage.
3. WHEN the user submits the Input_Form with all fields filled and a valid positive amount, THE Input_Form SHALL reset all fields to their default empty/placeholder state after submission.
4. IF the user submits the Input_Form with any field empty, THEN THE Validator SHALL display an inline error message indicating which field is missing.
5. IF the user submits the Input_Form with an amount that is not a positive number, THEN THE Validator SHALL display an inline error message stating the amount must be a positive number.

---

### Requirement 2: View Transaction List

**User Story:** As a user, I want to see a scrollable list of all my transactions, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each transaction's item name, amount, and category.
2. WHILE the number of transactions exceeds the visible area, THE Transaction_List SHALL be scrollable to reveal all entries.
3. WHEN the App loads, THE Transaction_List SHALL render all transactions previously persisted in Storage.

---

### Requirement 3: Delete a Transaction

**User Story:** As a user, I want to delete a transaction from the list, so that I can correct mistakes or remove unwanted entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL display a delete control for each transaction entry.
2. WHEN the user activates the delete control for a transaction, THE App SHALL remove that transaction from the Transaction_List and from Storage.

---

### Requirement 4: Display Total Balance

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts, formatted as a currency value with two decimal places.
2. WHEN a transaction is added, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
3. WHEN a transaction is deleted, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
4. WHEN the App loads with no transactions in Storage, THE Balance_Display SHALL show a value of 0.00.

---

### Requirement 5: Visualize Spending by Category

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL display a pie chart with one segment per category that has at least one transaction.
2. THE Chart SHALL label each segment with the category name and its percentage of total spending.
3. WHEN a transaction is added, THE Chart SHALL update to reflect the new spending distribution without requiring a page reload.
4. WHEN a transaction is deleted, THE Chart SHALL update to reflect the new spending distribution without requiring a page reload.
5. WHEN the App loads with no transactions in Storage, THE Chart SHALL render in an empty or placeholder state.

---

### Requirement 6: Persist Data Across Sessions

**User Story:** As a user, I want my transactions to be saved between browser sessions, so that I do not lose my spending history when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a transaction is added, THE Storage SHALL save the updated transaction list to Local Storage.
2. WHEN a transaction is deleted, THE Storage SHALL save the updated transaction list to Local Storage.
3. WHEN the App loads, THE App SHALL read all transactions from Local Storage and restore the Transaction_List, Balance_Display, and Chart to their last known state.
4. IF Local Storage is unavailable or returns malformed data, THEN THE App SHALL initialize with an empty transaction list and display a non-blocking warning message to the user.

---

### Requirement 7: Responsive and Compatible Layout

**User Story:** As a user, I want the app to work well on both mobile and desktop browsers, so that I can track spending from any device.

#### Acceptance Criteria

1. THE App SHALL render a usable layout on viewport widths from 320px to 1920px without horizontal scrolling.
2. THE App SHALL function correctly in Chrome, Firefox, Edge, and Safari without browser-specific polyfills or plugins.
3. THE App SHALL load and become interactive within 3 seconds on a standard broadband connection.

---

### Requirement 8: Single-File Architecture

**User Story:** As a developer, I want the project to follow a strict single-file-per-type structure, so that the codebase stays clean and maintainable.

#### Acceptance Criteria

1. THE App SHALL contain exactly one CSS file located at `css/`.
2. THE App SHALL contain exactly one JavaScript file located at `js/`.
3. THE App SHALL be implemented using HTML, CSS, and Vanilla JavaScript with no front-end frameworks or build tools required.
