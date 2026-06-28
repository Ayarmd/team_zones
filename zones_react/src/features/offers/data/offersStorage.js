import { calcOfferPrice, parsePriceNumber } from "./offerMeta";
import { loadActivePackages } from "../../devices-packages/data/packagesStorage";
import { hallScopedKey } from "../../../shared/tenant/hallScopedStorage";
import { fetchManagerOffers } from "./managerOffersApi";
import { getActiveStaffSession, isApiStaffSession } from "../../devices-packages/data/hallCatalogSync";

const BASE_KEY = "zones-offers-v2";
const storageKey = () => hallScopedKey(BASE_KEY);

export const OFFERS_STORAGE_EVENT = "zones-offers-updated";

const LEGACY_KEYS = ["zones-offers-v1", "zones-offers-v2"];
const LEGACY_PURGE_FLAG = "zones-offers-legacy-purged-v3";

function purgeLegacyOfferStorage() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(LEGACY_PURGE_FLAG)) return;
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
  localStorage.setItem(LEGACY_PURGE_FLAG, "1");
}

purgeLegacyOfferStorage();

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OFFERS_STORAGE_EVENT));
}

function slashToIso(slashDate) {
  if (!slashDate || typeof slashDate !== "string") return "";
  const parts = slashDate.trim().split("/");
  if (parts.length !== 3) return slashDate;
  const [y, m, d] = parts;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const DEFAULT_OFFERS = [];

function normalizeOffer(row) {
  const packages = loadActivePackages();
  const packageId = row.packageId != null ? Number(row.packageId) : packages[0]?.id ?? null;
  const pkg = packages.find((p) => p.id === packageId);
  const packagePrice = parsePriceNumber(pkg?.price);

  let discountPercent =
    row.discountPercent != null ? parsePriceNumber(row.discountPercent) : null;
  if (discountPercent == null && row.price != null && packagePrice > 0) {
    discountPercent = Math.round((1 - parsePriceNumber(row.price) / packagePrice) * 100);
  }
  if (discountPercent == null) discountPercent = 0;

  const price = calcOfferPrice(packagePrice, discountPercent);

  return {
    ...row,
    packageId: Number.isFinite(packageId) ? packageId : null,
    discountPercent,
    price,
    startDate: slashToIso(row.startDate) || row.startDate,
    endDate: slashToIso(row.endDate) || row.endDate,
  };
}

export function getOfferPackageLabel(packageId, packages = loadActivePackages()) {
  if (packageId == null) return "—";
  return packages.find((p) => p.id === packageId)?.name ?? "—";
}

export function getOfferPackagePrice(packageId, packages = loadActivePackages()) {
  if (packageId == null) return 0;
  const pkg = packages.find((p) => p.id === packageId);
  return parsePriceNumber(pkg?.price);
}

export function loadOffers() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [];
    return parsed.map(normalizeOffer);
  } catch {
    return [];
  }
}

export function saveOffers(list) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(list));
    notifyUpdated();
  } catch {
    /* ignore */
  }
}

/** Sync offers from Laravel for manager/reception API sessions. */
export async function refreshOffersFromApi() {
  const session = getActiveStaffSession();
  if (!isApiStaffSession(session)) {
    return { ok: false, skipped: true };
  }
  if (!["manager", "reception"].includes(session.role)) {
    return { ok: false, skipped: true };
  }

  const result = await fetchManagerOffers();
  if (result.ok) {
    saveOffers(result.offers.map(normalizeOffer));
  }
  return result;
}
