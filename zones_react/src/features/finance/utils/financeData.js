import {
  buildStoredCategoryBreakdown,
  buildStoredDailyExpenseSeries,
  sumExpensesInMonth,
  sumExpensesInPrevMonth,
} from "../data/expensesStorage";

export const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const REVENUE_CATEGORIES = [
  { key: "bookings", label: "الحجوزات", color: "#22d3ee" },
  { key: "devices", label: "الأجهزة", color: "#a78bfa" },
  { key: "packages", label: "الباقات", color: "#34d399" },
  { key: "extras", label: "خدمات إضافية", color: "#fbbf24" },
];

export const EXPENSE_CATEGORIES = [
  { key: "salaries", label: "رواتب الموظفين", color: "#fb7185" },
  { key: "maintenance", label: "الصيانة", color: "#f97316" },
  { key: "purchases", label: "المشتريات", color: "#c084fc" },
  { key: "utilities", label: "المرافق والخدمات", color: "#38bdf8" },
  { key: "other", label: "أخرى", color: "#94a3b8" },
];

export function mix(n) {
  const x = Math.sin(n) * 43758.5453123;
  return x - Math.floor(x);
}

export function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}

export function formatCurrency(value) {
  return `${new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 0 }).format(Math.round(value))} د.ل`;
}

export function formatPct(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}% عن الشهر السابق`;
}

export function yearOptions() {
  const y0 = new Date().getFullYear();
  return [y0 - 1, y0, y0 + 1];
}

/** سلسلة إيرادات فقط حسب الفترة (يومي / أسبوعي / شهري) */
export function buildRevenueSeries(year, month, granularity) {
  const seed = year * 400 + month * 17 + (granularity === "daily" ? 3 : granularity === "weekly" ? 7 : 11);
  const out = [];

  if (granularity === "daily") {
    const n = daysInMonth(year, month);
    for (let d = 1; d <= n; d += 1) {
      const t = seed + d * 1.7;
      const wave = mix(t) * 0.55 + mix(t + 4) * 0.45;
      const revenue = 3200 + wave * 4200 + mix(t + 2) * 1800;
      out.push({ label: String(d), revenue });
    }
    return out;
  }

  if (granularity === "weekly") {
    for (let w = 1; w <= 4; w += 1) {
      const t = seed + w * 11;
      const revenue = 18000 + mix(t) * 22000 + mix(t + 3) * 8000;
      out.push({ label: `الأسبوع ${w}`, revenue });
    }
    return out;
  }

  for (let m = 0; m < 12; m += 1) {
    const t = seed + m * 19 + year;
    const revenue = 95000 + mix(t) * 72000 + mix(t + 6) * 40000;
    out.push({ label: MONTHS_AR[m].slice(0, 3), revenue });
  }
  return out;
}

export function deriveRevenueTotals(year, month) {
  const seed = year * 400 + month * 23;
  const total = 128000 + mix(seed) * 92000 + mix(seed + 1) * 48000;
  const prev = total / (1 + (mix(seed + 5) - 0.5) * 0.14);
  const revDelta = ((total - prev) / prev) * 100;
  return { total, revDelta };
}

export function deriveRevenueInsights(series, granularity) {
  if (!series.length) {
    return {
      total: 0,
      dailyAvg: 0,
      highestLabel: "—",
      highestValue: 0,
      lowestLabel: "—",
      lowestValue: 0,
    };
  }

  let highest = series[0];
  let lowest = series[0];
  let sum = 0;
  for (const p of series) {
    sum += p.revenue;
    if (p.revenue > highest.revenue) highest = p;
    if (p.revenue < lowest.revenue) lowest = p;
  }

  const divisor =
    granularity === "daily" ? series.length : granularity === "weekly" ? series.length * 7 : 30;

  return {
    total: sum,
    dailyAvg: sum / Math.max(divisor, 1),
    highestLabel: highest.label,
    highestValue: highest.revenue,
    lowestLabel: lowest.label,
    lowestValue: lowest.revenue,
  };
}

/** توزيع الإيرادات حسب الفئة (محاكاة من الحجوزات والمدفوعات) */
export function buildCategoryBreakdown(year, month) {
  const seed = year * 500 + month * 31;
  const raw = REVENUE_CATEGORIES.map((cat, i) => {
    const t = seed + i * 13;
    const weight = 0.15 + mix(t) * 0.35;
    return { ...cat, value: weight };
  });
  const sum = raw.reduce((a, b) => a + b.value, 0);
  const totalRevenue = deriveRevenueTotals(year, month).total;
  return raw.map((r) => ({
    name: r.label,
    key: r.key,
    value: Math.round((r.value / sum) * totalRevenue),
    color: r.color,
  }));
}

/** سلسلة مصروفات حسب الفترة */
function aggregateExpenseSeries(daily, granularity, year, month) {
  if (granularity === "daily") return daily;
  if (granularity === "weekly") {
    const out = [];
    for (let w = 0; w < 4; w += 1) {
      const slice = daily.slice(w * 7, (w + 1) * 7);
      out.push({
        label: `الأسبوع ${w + 1}`,
        expenses: slice.reduce((s, p) => s + p.expenses, 0),
      });
    }
    return out;
  }
  const monthTotal = daily.reduce((s, p) => s + p.expenses, 0);
  return MONTHS_AR.map((name, m) => ({
    label: name.slice(0, 3),
    expenses: m + 1 === month ? monthTotal : 0,
  }));
}

export function buildExpenseSeries(year, month, granularity) {
  const daily = buildStoredDailyExpenseSeries(year, month);
  if (daily.some((d) => d.expenses > 0)) {
    return aggregateExpenseSeries(daily, granularity, year, month);
  }

  const seed = year * 520 + month * 19 + (granularity === "daily" ? 5 : granularity === "weekly" ? 9 : 13);
  const out = [];

  if (granularity === "daily") {
    const n = daysInMonth(year, month);
    for (let d = 1; d <= n; d += 1) {
      const t = seed + d * 2.1;
      const wave = mix(t) * 0.5 + mix(t + 3) * 0.5;
      const expenses = 1400 + wave * 2800 + mix(t + 1) * 1200;
      out.push({ label: String(d), expenses });
    }
    return out;
  }

  if (granularity === "weekly") {
    for (let w = 1; w <= 4; w += 1) {
      const t = seed + w * 13;
      const expenses = 9000 + mix(t) * 14000 + mix(t + 2) * 5000;
      out.push({ label: `الأسبوع ${w}`, expenses });
    }
    return out;
  }

  for (let m = 0; m < 12; m += 1) {
    const t = seed + m * 21 + year;
    const expenses = 48000 + mix(t) * 38000 + mix(t + 4) * 22000;
    out.push({ label: MONTHS_AR[m].slice(0, 3), expenses });
  }
  return out;
}

export function deriveExpenseTotals(year, month) {
  const current = sumExpensesInMonth(year, month);
  if (current.count > 0) {
    const prev = sumExpensesInPrevMonth(year, month);
    const expDelta = prev.total > 0 ? ((current.total - prev.total) / prev.total) * 100 : 0;
    return { total: current.total, expDelta };
  }

  const seed = year * 520 + month * 27;
  const total = 62000 + mix(seed) * 48000 + mix(seed + 2) * 24000;
  const prev = total / (1 + (mix(seed + 4) - 0.5) * 0.12);
  const expDelta = ((total - prev) / prev) * 100;
  return { total, expDelta };
}

export function deriveExpenseInsights(series, granularity) {
  if (!series.length) {
    return {
      dailyAvg: 0,
      highestLabel: "—",
      highestValue: 0,
      lowestLabel: "—",
      lowestValue: 0,
    };
  }

  let highest = series[0];
  let lowest = series[0];
  let sum = 0;
  for (const p of series) {
    sum += p.expenses;
    if (p.expenses > highest.expenses) highest = p;
    if (p.expenses < lowest.expenses) lowest = p;
  }

  const divisor =
    granularity === "daily" ? series.length : granularity === "weekly" ? series.length * 7 : 30;

  return {
    dailyAvg: sum / Math.max(divisor, 1),
    highestLabel: highest.label,
    highestValue: highest.expenses,
    lowestLabel: lowest.label,
    lowestValue: lowest.expenses,
  };
}

/** سلسلة صافي الربح (إيرادات − مصروفات) */
export function buildNetProfitSeries(year, month, granularity) {
  const revenueSeries = buildRevenueSeries(year, month, granularity);
  const expenseSeries = buildExpenseSeries(year, month, granularity);
  return revenueSeries.map((r, i) => ({
    label: r.label,
    netProfit: Math.max(0, r.revenue - (expenseSeries[i]?.expenses ?? r.revenue * 0.35)),
  }));
}

export function deriveNetProfitTotals(year, month) {
  const rev = deriveRevenueTotals(year, month);
  const exp = deriveExpenseTotals(year, month);
  const total = rev.total - exp.total;
  const prevRev = rev.total / (1 + (mix(year * 400 + month * 23 + 5) - 0.5) * 0.14);
  const prevExp = exp.total / (1 + (mix(year * 520 + month * 27 + 4) - 0.5) * 0.12);
  const prevNet = prevRev - prevExp;
  const netDelta = ((total - prevNet) / Math.abs(prevNet || 1)) * 100;
  return { total, netDelta };
}

export function deriveNetProfitInsights(series, granularity) {
  if (!series.length) {
    return {
      dailyAvg: 0,
      highestLabel: "—",
      highestValue: 0,
      lowestLabel: "—",
      lowestValue: 0,
    };
  }

  let highest = series[0];
  let lowest = series[0];
  let sum = 0;
  for (const p of series) {
    sum += p.netProfit;
    if (p.netProfit > highest.netProfit) highest = p;
    if (p.netProfit < lowest.netProfit) lowest = p;
  }

  const divisor =
    granularity === "daily" ? series.length : granularity === "weekly" ? series.length * 7 : 30;

  return {
    dailyAvg: sum / Math.max(divisor, 1),
    highestLabel: highest.label,
    highestValue: highest.netProfit,
    lowestLabel: lowest.label,
    lowestValue: lowest.netProfit,
  };
}

export const PROFIT_CATEGORIES = [
  { key: "devices", label: "الأجهزة", color: "#22c55e" },
  { key: "packages", label: "الباقات", color: "#6B5478" },
  { key: "bookings", label: "الحجوزات", color: "#34d399" },
  { key: "offers", label: "العروض", color: "#a78bfa" },
];

/** توزيع الأرباح حسب المصدر */
export function buildProfitCategoryBreakdown(year, month) {
  const seed = year * 600 + month * 37;
  const raw = PROFIT_CATEGORIES.map((cat, i) => {
    const t = seed + i * 17;
    const weight = 0.12 + mix(t) * 0.38;
    return { ...cat, value: weight };
  });
  const sum = raw.reduce((a, b) => a + b.value, 0);
  const totalProfit = deriveNetProfitTotals(year, month).total;
  return raw.map((r) => ({
    name: r.label,
    key: r.key,
    value: Math.round((r.value / sum) * totalProfit),
    color: r.color,
  }));
}

export function deriveProfitHighlights(year, month) {
  const seed = year * 700 + month * 41;
  const devices = [
    { name: "PS5 — VIP", profit: 18200 + mix(seed) * 8400 },
    { name: "PC Gaming — أ", profit: 16400 + mix(seed + 1) * 7200 },
    { name: "Xbox Series X", profit: 14800 + mix(seed + 2) * 6800 },
  ];
  const topDevice = devices.reduce((a, b) => (b.profit > a.profit ? b : a), devices[0]);

  const packages = [
    { name: "باقة 3 ساعات", count: 186 + Math.round(mix(seed + 5) * 48) },
    { name: "باقة يوم كامل", count: 142 + Math.round(mix(seed + 6) * 36) },
    { name: "باقة أسبوعية", count: 98 + Math.round(mix(seed + 7) * 28) },
  ];
  const topPackage = packages.reduce((a, b) => (b.count > a.count ? b : a), packages[0]);

  const dailyBookings = Math.round((42 + mix(seed + 9) * 28) * 10) / 10;

  return {
    topDevice: topDevice.name,
    topDeviceProfit: topDevice.profit,
    topPackage: topPackage.name,
    topPackageCount: topPackage.count,
    dailyBookings,
  };
}

const REPORT_TYPE_LABELS = {
  full: "تقرير شامل",
  revenue: "الإيرادات",
  expenses: "المصروفات",
  net: "صافي الأرباح",
};

export function resolveReportPeriod(period, customFrom, customTo) {
  const now = new Date();
  let from = new Date(now);
  let to = new Date(now);
  to.setHours(23, 59, 59, 999);

  if (period === "week") {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    from.setHours(0, 0, 0, 0);
  } else if (period === "year") {
    from = new Date(now.getFullYear(), 0, 1);
    from.setHours(0, 0, 0, 0);
  } else if (period === "custom" && customFrom && customTo) {
    from = new Date(customFrom);
    from.setHours(0, 0, 0, 0);
    to = new Date(customTo);
    to.setHours(23, 59, 59, 999);
  } else {
    from.setHours(0, 0, 0, 0);
  }

  return { from, to };
}

function formatPeriodLabel(from, to) {
  const opts = { year: "numeric", month: "short", day: "numeric" };
  return `${from.toLocaleDateString("ar-LY", opts)} — ${to.toLocaleDateString("ar-LY", opts)}`;
}

function scaleByDays(value, daySpan, year, month) {
  const monthDays = daysInMonth(year, month);
  const factor = Math.min(Math.max(daySpan / monthDays, 0.25), 3);
  return Math.round(value * factor);
}

/** بيانات التقرير المالي للـ PDF */
export function buildReportPayload(reportType, from, to) {
  const year = to.getFullYear();
  const month = to.getMonth() + 1;
  const daySpan = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000));

  const rev = deriveRevenueTotals(year, month);
  const exp = deriveExpenseTotals(year, month);
  const net = deriveNetProfitTotals(year, month);

  const revenueSeries = buildRevenueSeries(year, month, "daily")
    .slice(0, Math.min(daySpan, 31))
    .map((d) => ({ label: d.label, value: d.revenue }));
  const expenseSeries = buildExpenseSeries(year, month, "daily")
    .slice(0, Math.min(daySpan, 31))
    .map((d) => ({ label: d.label, value: d.expenses }));
  const profitSeries = buildNetProfitSeries(year, month, "daily")
    .slice(0, Math.min(daySpan, 31))
    .map((d) => ({ label: d.label, value: d.netProfit }));

  const profitSeriesRaw = buildNetProfitSeries(year, month, "daily").slice(0, Math.min(daySpan, 31));
  const insights = deriveNetProfitInsights(profitSeriesRaw, "daily");
  const highlights = deriveProfitHighlights(year, month);

  const loungeName =
    (typeof localStorage !== "undefined" && localStorage.getItem("zones-lounge-name")) ||
    "ZONES Gaming Center";

  return {
    loungeName,
    createdAt: new Date().toLocaleString("ar-LY", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    periodLabel: formatPeriodLabel(from, to),
    reportType,
    reportTypeLabel: REPORT_TYPE_LABELS[reportType] ?? REPORT_TYPE_LABELS.full,
    summary: {
      revenue: scaleByDays(rev.total, daySpan, year, month),
      expenses: scaleByDays(exp.total, daySpan, year, month),
      net: scaleByDays(net.total, daySpan, year, month),
    },
    charts: {
      profit: profitSeries,
      revenue: revenueSeries,
      expenses: expenseSeries,
    },
    stats: {
      topDevice: highlights.topDevice,
      topPackage: highlights.topPackage,
      dailyBookings: highlights.dailyBookings,
      bestProfitDay: insights.bestLabel,
      bestProfitValue: insights.bestProfit,
    },
  };
}

export function buildExpenseCategoryBreakdown(year, month) {
  const stored = buildStoredCategoryBreakdown(year, month);
  if (stored.length > 0) return stored;

  const seed = year * 600 + month * 37;
  const raw = EXPENSE_CATEGORIES.map((cat, i) => {
    const t = seed + i * 17;
    const weight = 0.12 + mix(t) * 0.32;
    return { ...cat, value: weight };
  });
  const sum = raw.reduce((a, b) => a + b.value, 0);
  const totalExpenses = deriveExpenseTotals(year, month).total;
  return raw.map((r) => ({
    name: r.label,
    key: r.key,
    value: Math.round((r.value / sum) * totalExpenses),
    color: r.color,
  }));
}
