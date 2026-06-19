const LEDGER_KEY = "zones-booking-revenue-ledger-v1";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export const BOOKING_REVENUE_EVENT = "zones-booking-revenue-updated";

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BOOKING_REVENUE_EVENT));
}

export function parsePackagePrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number.parseFloat(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function loadLedgerRaw() {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistLedger(rows) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(rows.slice(0, 2000)));
  notifyUpdated();
}

export function loadRevenueLedger() {
  return loadLedgerRaw().sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
}

export function hasBookingRevenueData() {
  return loadLedgerRaw().length > 0;
}

/** تسجيل إيراد جلسة مكتملة — يُستدعى عند إنهاء الجلسة */
export function recordCompletedSessionRevenue(slot) {
  if (!slot) return null;

  const isPointsPayment = slot.paymentType === "points";
  const revenue = isPointsPayment ? 0 : parsePackagePrice(slot.packagePrice);
  if (!isPointsPayment && revenue <= 0) return null;

  const completedAt = new Date().toISOString();
  const completedDate = completedAt.slice(0, 10);
  const ledger = loadLedgerRaw();
  const id = ledger.reduce((max, row) => Math.max(max, row.id ?? 0), 0) + 1;

  const entry = {
    id,
    bookingCode: slot.bookingCode || "",
    bookingDate: slot.date || completedDate,
    completedAt,
    completedDate,
    revenue,
    paymentType: slot.paymentType || "cash",
    source: slot.source || "manual",
    packageName: slot.packageName || "—",
    packageId: slot.packageId ?? null,
    deviceId: slot.deviceId ?? null,
    visitorName: slot.visitorName || "",
  };

  persistLedger([entry, ...ledger]);
  return entry;
}

export function sumRevenueOnDate(isoDate) {
  return loadLedgerRaw()
    .filter((row) => row.completedDate === isoDate)
    .reduce((sum, row) => sum + (row.revenue || 0), 0);
}

export function sumRevenueInMonth(year, month) {
  return loadLedgerRaw()
    .filter((row) => {
      const [y, m] = String(row.completedDate || "").split("-").map(Number);
      return y === year && m === month;
    })
    .reduce((sum, row) => sum + (row.revenue || 0), 0);
}

function shiftIsoDate(iso, deltaDays) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function getTodayRevenueSummary(referenceDate = todayIso()) {
  const yesterday = shiftIsoDate(referenceDate, -1);
  const todayTotal = sumRevenueOnDate(referenceDate);
  const yesterdayTotal = sumRevenueOnDate(yesterday);
  let deltaPct = 0;
  if (yesterdayTotal > 0) {
    deltaPct = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
  } else if (todayTotal > 0) {
    deltaPct = 100;
  }
  return { todayTotal, yesterdayTotal, deltaPct };
}

export function formatRevenueDayDelta(deltaPct) {
  if (deltaPct === 0) return "بدون تغيّ عن أمس";
  const sign = deltaPct > 0 ? "+" : "";
  return `${sign}${Math.round(deltaPct)}% عن أمس`;
}

function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}

export function buildBookingRevenueDailySeries(year, month) {
  const n = daysInMonth(year, month);
  const out = [];
  for (let d = 1; d <= n; d += 1) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    out.push({ label: String(d), revenue: sumRevenueOnDate(iso) });
  }
  return out;
}

export function buildBookingRevenueWeeklySeries(year, month) {
  const daily = buildBookingRevenueDailySeries(year, month);
  const out = [];
  for (let w = 0; w < 4; w += 1) {
    const slice = daily.slice(w * 7, (w + 1) * 7);
    out.push({
      label: `الأسبوع ${w + 1}`,
      revenue: slice.reduce((sum, p) => sum + p.revenue, 0),
    });
  }
  return out;
}

export function buildBookingRevenueMonthlySeries(year) {
  const MONTHS_AR = [
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
  return MONTHS_AR.map((name, index) => ({
    label: name.slice(0, 3),
    revenue: sumRevenueInMonth(year, index + 1),
  }));
}

export function buildBookingCategoryBreakdown(year, month, totalRevenue) {
  const rows = loadLedgerRaw().filter((row) => {
    const [y, m] = String(row.completedDate || "").split("-").map(Number);
    return y === year && m === month;
  });

  if (!rows.length || totalRevenue <= 0) {
    return [
      { name: "الحجوزات", key: "bookings", value: 0, color: "#22d3ee" },
      { name: "الباقات", key: "packages", value: 0, color: "#34d399" },
      { name: "تطبيق الزبون", key: "app", value: 0, color: "#a78bfa" },
      { name: "حجز يدوي", key: "manual", value: 0, color: "#fbbf24" },
    ];
  }

  const appTotal = rows.filter((r) => r.source === "app").reduce((s, r) => s + r.revenue, 0);
  const manualTotal = totalRevenue - appTotal;

  return [
    { name: "الحجوزات", key: "bookings", value: Math.round(totalRevenue), color: "#22d3ee" },
    { name: "تطبيق الزبون", key: "app", value: Math.round(appTotal), color: "#a78bfa" },
    { name: "حجز يدوي", key: "manual", value: Math.round(manualTotal), color: "#fbbf24" },
    {
      name: "الباقات",
      key: "packages",
      value: Math.round(totalRevenue * 0.85),
      color: "#34d399",
    },
  ];
}

export function deriveBookingProfitHighlights(year, month) {
  const rows = loadLedgerRaw().filter((row) => {
    const [y, m] = String(row.completedDate || "").split("-").map(Number);
    return y === year && m === month;
  });

  const packageCounts = new Map();
  const deviceProfit = new Map();
  const dayCounts = new Map();

  for (const row of rows) {
    const pkg = row.packageName || "—";
    packageCounts.set(pkg, (packageCounts.get(pkg) || 0) + 1);
    const deviceKey = row.deviceId ? `جهاز #${row.deviceId}` : "—";
    deviceProfit.set(deviceKey, (deviceProfit.get(deviceKey) || 0) + row.revenue);
    dayCounts.set(row.completedDate, (dayCounts.get(row.completedDate) || 0) + 1);
  }

  let topPackage = "—";
  let topPackageCount = 0;
  for (const [name, count] of packageCounts) {
    if (count > topPackageCount) {
      topPackage = name;
      topPackageCount = count;
    }
  }

  let topDevice = "—";
  let topDeviceProfit = 0;
  for (const [name, profit] of deviceProfit) {
    if (profit > topDeviceProfit) {
      topDevice = name;
      topDeviceProfit = profit;
    }
  }

  const daysWithBookings = dayCounts.size || 1;
  const dailyBookings = Math.round((rows.length / daysWithBookings) * 10) / 10;

  return {
    topDevice,
    topDeviceProfit,
    topPackage,
    topPackageCount,
    dailyBookings,
  };
}

export function countCompletedSessionsInMonth(year, month) {
  return loadLedgerRaw().filter((row) => {
    const [y, m] = String(row.completedDate || "").split("-").map(Number);
    return y === year && m === month;
  }).length;
}
