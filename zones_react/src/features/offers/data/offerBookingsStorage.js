import { hallScopedKey } from "../../../shared/tenant/hallScopedStorage";

const BASE_KEY = "zones-offer-bookings-v2";
const storageKey = () => hallScopedKey(BASE_KEY);

export const OFFER_BOOKINGS_EVENT = "zones-offer-bookings-updated";

const LEGACY_KEYS = ["zones-offer-bookings-v1", "zones-offer-bookings-v2"];
const LEGACY_PURGE_FLAG = "zones-offer-bookings-legacy-purged-v3";

function purgeLegacyOfferBookingStorage() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(LEGACY_PURGE_FLAG)) return;
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
  localStorage.setItem(LEGACY_PURGE_FLAG, "1");
}

purgeLegacyOfferBookingStorage();

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OFFER_BOOKINGS_EVENT));
}

export function loadOfferBookings() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOfferBookings(list) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(list));
    notifyUpdated();
  } catch {
    /* ignore */
  }
}

/** عدد مرات استخدام العرض — من عمليات الحجز */
export function getOfferUsageCount(offerId, offerRow) {
  if (offerRow?.usageCount != null) return offerRow.usageCount;
  return loadOfferBookings().filter((b) => b.offerId === offerId).length;
}

/** العرض الأكثر استخداماً — من بيانات العروض (API) أو الحجوزات المحلية */
export function getMostUsedOfferStats(offers = []) {
  const fromApi = offers.some((o) => o.usageCount != null);
  if (fromApi) {
    let top = null;
    for (const offer of offers) {
      const count = offer.usageCount ?? 0;
      if (!top || count > top.count) {
        top = { count, name: offer.name ?? "—" };
      }
    }
    return top ?? { count: 0, name: "لا استخدام بعد" };
  }

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
