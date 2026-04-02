# Expense & Budget Visualizer

🔗 **Live Demo:** [santos-42.github.io/CodingCamp-30Mar26-Rio-Santoso](https://santos-42.github.io/CodingCamp-30Mar26-Rio-Santoso/)
📁 **GitHub:** [Santos-42/CodingCamp-30Mar26-Rio-Santoso](https://github.com/Santos-42/CodingCamp-30Mar26-Rio-Santoso)

---

A mobile-friendly web app for tracking daily spending. It shows your total balance, a history of transactions, and a visual pie chart of spending by category — all without any backend or setup required.

## Features

### MVP
- Add transactions with item name, amount, and category (Food, Transport, Fun)
- Form validation — all fields required, amount must be positive
- Scrollable transaction list with delete per item
- Total balance display that updates automatically
- Pie chart showing spending distribution by category (Canvas 2D API)
- Data persists across sessions via browser Local Storage

### Optional Challenges (all three implemented)
- **Monthly Summary View** — browse spending by month with prev/next navigation, showing totals and category breakdown
- **Spending Limit Highlight** — set a monthly budget limit; a status bar warns you when you go over
- **Dark / Light Mode Toggle** — theme switch in the header, preference saved to Local Storage

## Technologies Used

- HTML — structure
- CSS — styling, mobile-first responsive layout (320px–1920px)
- Vanilla JavaScript — all logic, no frameworks
- Browser Local Storage API — client-side data persistence (transactions, budget limit, theme)
- No backend, no build tools, no dependencies

## How to Run Locally

1. Clone or download the repository
2. Double-click `index.html`
3. That's it — opens directly in any modern browser (Chrome, Firefox, Edge, Safari)
