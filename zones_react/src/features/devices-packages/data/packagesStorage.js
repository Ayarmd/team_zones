const STORAGE_KEY = "zones-packages-v1";

export const PACKAGES_STORAGE_EVENT = "zones-packages-updated";

export const DEFAULT_PACKAGES = [
  {
    id: 1,
    name: "باقة VIP",
    price: "120 د.ل",
    hours: "5",
    deviceLabel: "PlayStation 5",
    description: "مشروب مجاني، غرفة خاصة، أولوية الحجز",
    notes: "",
    isActive: true,
    createdAt: "2026/05/01 — 10:00",
  },
  {
    id: 2,
    name: "باقة المحترف",
    price: "85 د.ل",
    hours: "4",
    deviceLabel: "جميع الأجهزة",
    description: "سناك مجاني، خصم 10% على المرطبات",
    notes: "",
    isActive: true,
    createdAt: "2026/05/02 — 11:00",
  },
  {
    id: 3,
    name: "باقة الأساسية",
    price: "55 د.ل",
    hours: "3",
    deviceLabel: "PS5 / Xbox",
    description: "وصول لجميع الأجهزة المتاحة",
    notes: "",
    isActive: true,
    createdAt: "2026/05/03 — 09:30",
  },
  {
    id: 4,
    name: "باقة الطالب",
    price: "35 د.ل",
    hours: "2",
    deviceLabel: "أجهزة الطلاب",
    description: "عرض أيام الأسبوع، إثبات طالب مطلوب",
    notes: "",
    isActive: true,
    createdAt: "2026/05/04 — 14:00",
  },
];

function notifyPackagesUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PACKAGES_STORAGE_EVENT));
}

function normalizePackage(row) {
  return {
    id: row.id,
    name: row.name ?? "",
    price: row.price ?? "—",
    hours: row.hours ?? "—",
    deviceLabel: row.deviceLabel ?? "—",
    description: row.description ?? row.extras ?? "",
    notes: row.notes ?? "",
    isActive: row.isActive !== false,
    isArchived: Boolean(row.isArchived),
    archivedAt: row.archivedAt || null,
    createdAt: row.createdAt || "—",
  };
}

export function loadPackages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PACKAGES.map(normalizePackage);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_PACKAGES.map(normalizePackage);
    return parsed.map(normalizePackage);
  } catch {
    return DEFAULT_PACKAGES.map(normalizePackage);
  }
}

export function loadActivePackages() {
  return loadPackages().filter((p) => !p.isArchived);
}

export function loadArchivedPackages() {
  return loadPackages().filter((p) => p.isArchived);
}

export function savePackages(list) {
  try {
    const serialized = JSON.stringify(list.map(normalizePackage));
    const prev = localStorage.getItem(STORAGE_KEY);
    if (prev === serialized) return;
    localStorage.setItem(STORAGE_KEY, serialized);
    notifyPackagesUpdated();
  } catch {
    /* ignore */
  }
}
