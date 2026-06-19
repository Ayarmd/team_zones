const STORAGE_KEY = "zones-package-bookings-v1";

export const PACKAGE_BOOKINGS_EVENT = "zones-package-bookings-updated";

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PACKAGE_BOOKINGS_EVENT));
}

/** حجوزات تجريبية — تُحدَّث عند تسجيل عمليات الحجز */
const DEFAULT_BOOKINGS = [
  { id: 1, packageId: 1, bookedAt: "2026-06-01T12:00:00" },
  { id: 2, packageId: 1, bookedAt: "2026-06-03T15:00:00" },
  { id: 3, packageId: 1, bookedAt: "2026-06-05T18:00:00" },
  { id: 4, packageId: 1, bookedAt: "2026-06-07T20:00:00" },
  { id: 5, packageId: 1, bookedAt: "2026-06-08T14:00:00" },
  { id: 6, packageId: 2, bookedAt: "2026-06-02T11:00:00" },
  { id: 7, packageId: 2, bookedAt: "2026-06-06T16:00:00" },
  { id: 8, packageId: 3, bookedAt: "2026-06-04T10:00:00" },
];

export function loadPackageBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_BOOKINGS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_BOOKINGS];
  } catch {
    return [...DEFAULT_BOOKINGS];
  }
}

export function savePackageBookings(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    notifyUpdated();
  } catch {
    /* ignore */
  }
}

function isCurrentMonth(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function formatActivityDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-LY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** عدد استخدامات الباقة هذا الشهر — من عمليات الحجز */
export function getPackageUsageThisMonth(packageId) {
  return loadPackageBookings().filter(
    (b) => b.packageId === packageId && isCurrentMonth(b.bookedAt),
  ).length;
}

/** تاريخ آخر نشاط للباقة — آخر حجز مسجّل */
export function getPackageLastActivity(packageId) {
  const bookings = loadPackageBookings().filter((b) => b.packageId === packageId);
  if (!bookings.length) return "—";
  const latest = bookings.reduce((a, b) =>
    new Date(a.bookedAt) > new Date(b.bookedAt) ? a : b,
  );
  return formatActivityDate(latest.bookedAt);
}

/** الأكثر طلباً هذا الشهر — يُحسب من عمليات الحجز */
export function getMostRequestedPackageStats(packages = []) {
  const bookings = loadPackageBookings().filter((b) => isCurrentMonth(b.bookedAt));
  const counts = new Map();
  for (const b of bookings) {
    counts.set(b.packageId, (counts.get(b.packageId) ?? 0) + 1);
  }
  let topId = null;
  let topCount = 0;
  for (const [id, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topId = id;
    }
  }
  const pkg = packages.find((p) => p.id === topId);
  return {
    count: topCount,
    name: pkg?.name ?? (topCount > 0 ? "—" : "لا طلبات بعد"),
  };
}
