import { MONTHS_AR, buildExpenseSeries, buildRevenueSeries, deriveExpenseTotals, deriveRevenueTotals, formatCurrency, mix } from "./financeData";

export function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}

/** دمج الإيرادات (محاكاة) مع المصروفات من سجل المصروفات */
export function buildOverviewChartSeries(year, month, granularity) {
  const revenueSeries = buildRevenueSeries(year, month, granularity);
  const expenseSeries = buildExpenseSeries(year, month, granularity);

  return revenueSeries.map((point, i) => {
    const expenses = expenseSeries[i]?.expenses ?? 0;
    const revenue = point.revenue ?? 0;
    return {
      label: point.label,
      revenue,
      expenses,
      netProfit: revenue - expenses,
    };
  });
}

export function deriveOverviewTotals(year, month) {
  const rev = deriveRevenueTotals(year, month);
  const exp = deriveExpenseTotals(year, month);
  const revenue = rev.total;
  const expenses = exp.total;
  const net = revenue - expenses;
  const prevRev = revenue / (1 + (rev.revDelta || 0) / 100);
  const prevExp = expenses / (1 + (exp.expDelta || 0) / 100);
  const prevNet = prevRev - prevExp;
  return {
    revenue,
    expenses,
    net,
    revDelta: rev.revDelta,
    expDelta: exp.expDelta,
    netDelta: ((net - prevNet) / Math.abs(prevNet || 1)) * 100,
  };
}

export function deriveOverviewInsights(year, month, series, granularity) {
  const seed = year * 300 + month * 13 + (granularity === "monthly" ? 99 : 0);
  const devices = [
    { name: "PS5 — منطقة VIP", hours: 138 + mix(seed) * 42 },
    { name: "PC Gaming — الصف أ", hours: 124 + mix(seed + 1) * 38 },
    { name: "Xbox Series X — ركن أ", hours: 112 + mix(seed + 2) * 36 },
  ];
  const top = devices[Math.floor(mix(seed + 4) * devices.length)];
  let best = series[0];
  let worst = series[0];
  for (const p of series) {
    if (p.netProfit > best.netProfit) best = p;
    if (p.netProfit < worst.netProfit) worst = p;
  }
  const dailyAvg = 42 + mix(seed + 8) * 28;
  return {
    topDevice: top.name,
    topHours: Math.round(top.hours),
    bestLabel: best.label,
    bestProfit: best.netProfit,
    worstLabel: worst.label,
    worstProfit: worst.netProfit,
    dailyBookings: Math.round(dailyAvg * 10) / 10,
  };
}

export function overviewTooltipBox(isLight) {
  return isLight
    ? {
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "0.65rem 0.85rem",
        color: "#111827",
        fontSize: "0.78rem",
        boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
      }
    : {
        background: "#111827",
        border: "1px solid rgba(75, 85, 99, 0.6)",
        borderRadius: "12px",
        padding: "0.65rem 0.85rem",
        color: "#f3f4f6",
        fontSize: "0.78rem",
      };
}

export function overviewChartPalette(isLight) {
  return isLight
    ? { grid: "#e5e7eb", tick: "#4b5563", axis: "#d1d5db", legend: "#111827" }
    : { grid: "rgba(107, 84, 120, 0.35)", tick: "#d1d5db", axis: "#6b5478", legend: "#f9fafb" };
}

export function formatOverviewTooltipValue(p, map, mutedColor) {
  return { label: map[p.dataKey] ?? p.dataKey, value: formatCurrency(p.value), mutedColor };
}
