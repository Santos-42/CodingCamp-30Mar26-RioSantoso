// js/app.js

// ─── State ───────────────────────────────────────────────────────────────────

let transactions = [];
let storageWarning = false;
let budgetLimit = 0;
let currentSummaryDate = new Date();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString() + Math.random();
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'expense_transactions';
const BUDGET_KEY  = 'expense_budget_limit';
const THEME_KEY   = 'expense_theme';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { storageWarning = true; return []; }
    return parsed;
  } catch (e) {
    storageWarning = true;
    return [];
  }
}

function saveToStorage(txns) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
}

function loadBudget() {
  const raw = localStorage.getItem(BUDGET_KEY);
  const val = parseFloat(raw);
  return isNaN(val) || val <= 0 ? 0 : val;
}

function saveBudget(val) {
  localStorage.setItem(BUDGET_KEY, String(val));
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

// ─── Validator ────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['Food', 'Transport', 'Fun'];

function validate(name, amount, category) {
  const errors = [];
  if (!name || name.trim() === '') {
    errors.push('Item name is required.');
  }
  if (amount === '' || amount === null || amount === undefined) {
    errors.push('Amount is required.');
  } else {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      errors.push('Amount must be a positive number.');
    }
  }
  if (!VALID_CATEGORIES.includes(category)) {
    errors.push('Please select a category.');
  }
  return errors;
}

// ─── State Mutations ──────────────────────────────────────────────────────────

function addTransaction(name, amount, category) {
  const transaction = {
    id: generateId(),
    name,
    amount: parseFloat(amount),
    category,
    date: new Date().toISOString(),
  };
  transactions.push(transaction);
  saveToStorage(transactions);
  renderAll();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage(transactions);
  renderAll();
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderAll() {
  renderList();
  renderBalance();
  renderChart();
  renderBudgetStatus();
  renderMonthlySummary();
}

function renderList() {
  const ul = document.getElementById('transaction-list');
  ul.innerHTML = '';
  transactions.forEach(t => {
    const li = document.createElement('li');
    const formattedAmount = '$' + t.amount.toFixed(2);
    li.innerHTML =
      `<span class="txn-name">${t.name}</span>` +
      `<span class="txn-amount">${formattedAmount}</span>` +
      `<span class="txn-category" data-category="${t.category}">${t.category}</span>` +
      `<button class="delete-btn" data-id="${t.id}">Delete</button>`;
    ul.appendChild(li);
  });
}

function renderBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const display = document.getElementById('balance-display');
  display.textContent = 'Total: $' + total.toFixed(2);
}

function renderChart() {
  const canvas = document.getElementById('pie-chart');
  const placeholder = document.getElementById('chart-placeholder');

  const totals = { Food: 0, Transport: 0, Fun: 0 };
  transactions.forEach(t => {
    if (totals[t.category] !== undefined) totals[t.category] += t.amount;
  });

  const total = totals.Food + totals.Transport + totals.Fun;

  if (total === 0) {
    placeholder.style.display = '';
    canvas.style.display = 'none';
    return;
  }

  placeholder.style.display = 'none';
  canvas.style.display = '';

  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy) * 0.75;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const colors = { Food: '#FF6384', Transport: '#36A2EB', Fun: '#FFCE56' };
  const categories = Object.keys(totals).filter(cat => totals[cat] > 0);
  let startAngle = -Math.PI / 2;

  categories.forEach(cat => {
    const slice = totals[cat] / total;
    const endAngle = startAngle + slice * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[cat];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const midAngle = startAngle + slice * Math.PI;
    const lr = radius * 0.65;
    const lx = cx + lr * Math.cos(midAngle);
    const ly = cy + lr * Math.sin(midAngle);
    const pct = Math.round(slice * 100);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cat, lx, ly - 7);
    ctx.fillText(pct + '%', lx, ly + 7);

    startAngle = endAngle;
  });
}

// ─── Budget Limit ─────────────────────────────────────────────────────────────

function renderBudgetStatus() {
  const el = document.getElementById('budget-status');
  if (!el) return;

  if (budgetLimit <= 0) {
    el.textContent = '';
    el.className = '';
    return;
  }

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const pct = Math.round((total / budgetLimit) * 100);

  if (total > budgetLimit) {
    el.textContent = `⚠ Over budget! $${total.toFixed(2)} spent of $${budgetLimit.toFixed(2)} limit (${pct}%)`;
    el.className = 'budget-over';
  } else {
    el.textContent = `$${total.toFixed(2)} of $${budgetLimit.toFixed(2)} limit used (${pct}%)`;
    el.className = 'budget-ok';
  }
}

// ─── Monthly Summary ──────────────────────────────────────────────────────────

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function renderMonthlySummary() {
  const label = document.getElementById('month-label');
  const container = document.getElementById('monthly-summary');
  if (!label || !container) return;

  const year = currentSummaryDate.getFullYear();
  const month = currentSummaryDate.getMonth();
  const monthKey = getMonthKey(currentSummaryDate);

  label.textContent = currentSummaryDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthTxns = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  if (monthTxns.length === 0) {
    container.innerHTML = '<p class="summary-empty">No transactions this month.</p>';
    return;
  }

  const totals = { Food: 0, Transport: 0, Fun: 0 };
  monthTxns.forEach(t => { if (totals[t.category] !== undefined) totals[t.category] += t.amount; });
  const grandTotal = monthTxns.reduce((s, t) => s + t.amount, 0);

  let html = `<div class="summary-total">Total: <strong>$${grandTotal.toFixed(2)}</strong></div><ul class="summary-list">`;
  VALID_CATEGORIES.forEach(cat => {
    if (totals[cat] > 0) {
      const pct = Math.round((totals[cat] / grandTotal) * 100);
      html += `<li><span class="txn-category" data-category="${cat}">${cat}</span> $${totals[cat].toFixed(2)} <span class="summary-pct">(${pct}%)</span></li>`;
    }
  });
  html += '</ul>';
  container.innerHTML = html;
}

// ─── Dark / Light Mode ────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────

document.getElementById('transaction-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const name     = document.getElementById('item-name').value;
  const amount   = document.getElementById('item-amount').value;
  const category = document.getElementById('item-category').value;
  const errors   = validate(name, amount, category);
  const errorsContainer = document.getElementById('form-errors');

  if (errors.length > 0) {
    errorsContainer.innerHTML = errors.map(msg => `<p>${msg}</p>`).join('');
  } else {
    errorsContainer.innerHTML = '';
    addTransaction(name, amount, category);
    e.target.reset();
  }
});

document.getElementById('transaction-list').addEventListener('click', function (e) {
  if (e.target.classList.contains('delete-btn')) {
    deleteTransaction(e.target.dataset.id);
  }
});

document.getElementById('budget-save').addEventListener('click', function () {
  const val = parseFloat(document.getElementById('budget-limit').value);
  if (!isNaN(val) && val > 0) {
    budgetLimit = val;
    saveBudget(val);
    renderBudgetStatus();
  }
});

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

document.getElementById('prev-month').addEventListener('click', function () {
  currentSummaryDate = new Date(currentSummaryDate.getFullYear(), currentSummaryDate.getMonth() - 1, 1);
  renderMonthlySummary();
});

document.getElementById('next-month').addEventListener('click', function () {
  currentSummaryDate = new Date(currentSummaryDate.getFullYear(), currentSummaryDate.getMonth() + 1, 1);
  renderMonthlySummary();
});

document.addEventListener('DOMContentLoaded', function () {
  transactions = loadFromStorage();
  budgetLimit  = loadBudget();

  const savedLimit = document.getElementById('budget-limit');
  if (budgetLimit > 0 && savedLimit) savedLimit.value = budgetLimit;

  applyTheme(loadTheme());
  renderAll();

  if (storageWarning) {
    const banner = document.createElement('div');
    banner.id = 'storage-warning-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML =
      'Could not load saved data. Starting fresh.' +
      '<button onclick="this.parentElement.remove()" aria-label="Dismiss warning">✕</button>';
    document.querySelector('main').prepend(banner);
  }
});
