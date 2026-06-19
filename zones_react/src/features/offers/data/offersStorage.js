import { calcOfferPrice, parsePriceNumber } from "./offerMeta";
import { loadActivePackages } from "../../devices-packages/data/packagesStorage";

const STORAGE_KEY = "zones-offers-v1";

export const OFFERS_STORAGE_EVENT = "zones-offers-updated";

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

const DEFAULT_OFFERS = [
  {
    id: 1,
    name: "خصم نهاية الأسبوع",
    packageId: 3,
    discountPercent: 30,
    description: "خصم على باقة الأساسية أيام الجمعة والسبت.",
    startDate: "2026-05-01",
    endDate: "2026-12-31",
    isActive: true,
    createdAt: "2026-04-20T10:00:00",
  },
  {
    id: 2,
    name: "باقة الصيف الموسمية",
    packageId: 1,
    discountPercent: 20,
    description: "خصم على باقة VIP مع مشروب مجاني.",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    isActive: true,
    createdAt: "2026-05-15T09:00:00",
  },
  {
    id: 3,
    name: "عرض الطلاب",
    packageId: 4,
    discountPercent: 15,
    description: "خصم على باقة الطالب مع إثبات تسجيل.",
    startDate: "2026-01-10",
    endDate: "2026-04-30",
    isActive: false,
    createdAt: "2026-01-05T08:00:00",
  },
  {
    id: 4,
    name: "عرض المحترف",
    packageId: 2,
    discountPercent: 25,
    description: "خصم على باقة المحترف — ساعة إضافية عند الحجز.",
    startDate: "2026-05-12",
    endDate: "2026-05-28",
    isActive: true,
    createdAt: "2026-05-10T11:00:00",
  },
];

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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_OFFERS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [...DEFAULT_OFFERS];
    return parsed.map(normalizeOffer);
  } catch {
    return [...DEFAULT_OFFERS];
  }
}

export function saveOffers(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    notifyUpdated();
  } catch {
    /* ignore */
  }
}
