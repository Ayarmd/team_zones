const STORAGE_KEY = "zones-offer-bookings-v1";

export const OFFER_BOOKINGS_EVENT = "zones-offer-bookings-updated";

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OFFER_BOOKINGS_EVENT));
}

/** حجوزات تجريبية — تُحدَّث لاحقاً من نظام الحجز */
const DEFAULT_BOOKINGS = [
  { id: 1, offerId: 1, bookedAt: "2026-06-01T12:00:00" },
  { id: 2, offerId: 1, bookedAt: "2026-06-03T15:00:00" },
  { id: 3, offerId: 1, bookedAt: "2026-06-05T18:00:00" },
  { id: 4, offerId: 1, bookedAt: "2026-06-07T20:00:00" },
  { id: 5, offerId: 1, bookedAt: "2026-06-08T14:00:00" },
  { id: 6, offerId: 2, bookedAt: "2026-06-02T11:00:00" },
  { id: 7, offerId: 2, bookedAt: "2026-06-06T16:00:00" },
  { id: 8, offerId: 4, bookedAt: "2026-06-04T10:00:00" },
  { id: 9, offerId: 4, bookedAt: "2026-06-05T12:00:00" },
  { id: 10, offerId: 4, bookedAt: "2026-06-06T13:00:00" },
];

export function loadOfferBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_BOOKINGS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_BOOKINGS];
  } catch {
    return [...DEFAULT_BOOKINGS];
  }
}

export function saveOfferBookings(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    notifyUpdated();
  } catch {
    /* ignore */
  }
}

/** عدد مرات استخدام العرض — من عمليات الحجز */
export function getOfferUsageCount(offerId) {
  return loadOfferBookings().filter((b) => b.offerId === offerId).length;
}

/** العرض الأكثر استخداماً — يُحسب من الحجوزات */
export function getMostUsedOfferStats(offers = []) {
  const bookings = loadOfferBookings();
  const counts = new Map();
  for (const b of bookings) {
    counts.set(b.offerId, (counts.get(b.offerId) ?? 0) + 1);
  }
  let topId = null;
  let topCount = 0;
  for (const [id, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topId = id;
    }
  }
  const offer = offers.find((o) => o.id === topId);
  return {
    count: topCount,
    name: offer?.name ?? (topCount > 0 ? "—" : "لا استخدام بعد"),
  };
}
