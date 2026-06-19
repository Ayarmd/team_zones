import { categoryLabel } from "./expenseMeta";

const STORAGE_KEY = "zones-hall-expenses-v1";
export const EXPENSES_STORAGE_EVENT = "zones-expenses-updated";

const BREAKDOWN_COLORS = ["#6B5478", "#3b82f6", "#f97316", "#eab308", "#22c55e", "#94a3b8", "#ec4899"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoFromParts(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function normalizeExpenseRow(row) {
  const name =
    row.name?.trim() ||
    row.categoryLabel?.trim() ||
    categoryLabel(row.category) ||
    "—";
  const { category, categoryLabel: _legacyLabel, ...rest } = row;
  return { ...rest, name };
}

function buildSeedRows() {
  const y = new Date().getFullYear();
  const m = new Date().getMonth() + 1;
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;

  return [
    { id: 1, name: "إيجار مكان", amount: 4500, isPaid: true, addedAt: isoFromParts(y, m, 1), paidAt: isoFromParts(y, m, 2), notes: "إيجار شهر الحالي." },
    { id: 2, name: "اشتراك نت", amount: 320, isPaid: true, addedAt: isoFromParts(y, m, 3), paidAt: isoFromParts(y, m, 3), notes: "اشتراك فايبر 100 ميجا." },
    { id: 3, name: "فواتير كهرباء", amount: 890, isPaid: true, addedAt: isoFromParts(y, m, 5), paidAt: isoFromParts(y, m, 8), notes: "فاتورة الكهرباء." },
    { id: 4, name: "صيانة جهاز", amount: 650, isPaid: true, addedAt: isoFromParts(y, m, 7), paidAt: isoFromParts(y, m, 9), notes: "صيانة PS5 — منطقة VIP." },
    { id: 5, name: "مصروف نظافة", amount: 280, isPaid: false, addedAt: isoFromParts(y, m, 10), paidAt: "", notes: "تنظيف أسبوعي للصالة." },
    { id: 6, name: "صيانة جهاز", amount: 420, isPaid: true, addedAt: isoFromParts(y, m, 12), paidAt: isoFromParts(y, m, 14), notes: "استبدال يد تحكم." },
    { id: 7, name: "اشتراك نت", amount: 320, isPaid: true, addedAt: isoFromParts(prevY, prevM, 3), paidAt: isoFromParts(prevY, prevM, 3), notes: "اشتراك الشهر السابق." },
    { id: 8, name: "إيجار مكان", amount: 4500, isPaid: true, addedAt: isoFromParts(prevY, prevM, 1), paidAt: isoFromParts(prevY, prevM, 2), notes: "" },
    { id: 9, name: "فواتير كهرباء", amount: 760, isPaid: true, addedAt: isoFromParts(prevY, prevM, 6), paidAt: isoFromParts(prevY, prevM, 10), notes: "" },
    { id: 10, name: "مصروف نظافة", amount: 300, isPaid: true, addedAt: isoFromParts(prevY, prevM, 15), paidAt: isoFromParts(prevY, prevM, 16), notes: "مصروف نظافة." },
    { id: 11, name: "صيانة جهاز", amount: 1100, isPaid: true, addedAt: isoFromParts(y, m, 18), paidAt: isoFromParts(y, m, 20), notes: "صيانة PC Gaming." },
    { id: 12, name: "فواتير كهرباء", amount: 150, isPaid: false, addedAt: isoFromParts(y, m, 22), paidAt: "", notes: "فاتورة جزئية — بانتظار الدفع." },
  ];
}

export function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedRows();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return buildSeedRows();
    return parsed.map(normalizeExpenseRow);
  } catch {
    return buildSeedRows();
  }
}

export function saveExpenses(rows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.map(normalizeExpenseRow)));
    window.dispatchEvent(new Event(EXPENSES_STORAGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

function parseIso(iso) {
  if (!iso || typeof iso !== "string") return null;
  const p = iso.split("-");
  if (p.length !== 3) return null;
  const y = Number(p[0]);
  const m = Number(p[1]);
  const d = Number(p[2]);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function expenseInMonth(row, year, month) {
  const ref = parseIso(row.paidAt) || parseIso(row.addedAt);
  if (!ref) return false;
  return ref.y === year && ref.m === month;
}

export function filterExpensesInMonth(rows, year, month) {
  return rows.filter((r) => expenseInMonth(r, year, month));
}

export function sumExpensesInMonth(year, month, rows = loadExpenses()) {
  const list = filterExpensesInMonth(rows, year, month);
  const total = list.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return { total, count: list.length, items: list };
}

export function sumExpensesInPrevMonth(year, month, rows = loadExpenses()) {
  const prevM = month === 1 ? 12 : month - 1;
  const prevY = month === 1 ? year - 1 : year;
  return sumExpensesInMonth(prevY, prevM, rows);
}

export function buildStoredDailyExpenseSeries(year, month, rows = loadExpenses()) {
  const days = new Date(year, month, 0).getDate();
  const buckets = Array.from({ length: days }, (_, i) => ({ label: String(i + 1), expenses: 0 }));

  for (const row of rows) {
    const refIso = row.paidAt || row.addedAt;
    const ref = parseIso(refIso);
    if (!ref || ref.y !== year || ref.m !== month) continue;
    const idx = ref.d - 1;
    if (idx >= 0 && idx < days) {
      buckets[idx].expenses += Number(row.amount) || 0;
    }
  }

  return buckets;
}

export function buildStoredCategoryBreakdown(year, month, rows = loadExpenses()) {
  const list = filterExpensesInMonth(rows, year, month);
  const map = {};
  for (const row of list) {
    const key = row.name?.trim() || "غير محدد";
    map[key] = (map[key] || 0) + (Number(row.amount) || 0);
  }
  return Object.entries(map).map(([key, value], i) => ({
    key,
    name: key,
    value,
    color: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length],
  }));
}
