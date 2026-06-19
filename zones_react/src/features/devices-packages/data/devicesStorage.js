import {
  migrateDevicesToCodeNames,
  suggestDeviceName,
  typeLabelFromType,
} from "./deviceNaming";

const STORAGE_KEY = "zones-devices-v2";
export const DEVICES_STORAGE_KEY = STORAGE_KEY;
const LEGACY_STORAGE_KEY = "zones-devices-v1";

/** يُبث عند أي تغيير على قائمة الأجهزة (مدير أو صيانة) */
export const DEVICES_STORAGE_EVENT = "zones-devices-updated";

function notifyDevicesUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEVICES_STORAGE_EVENT));
}

export const DEFAULT_DEVICES = [
  {
    id: 1,
    name: "PS5-01",
    type: "ps5",
    typeLabel: "PlayStation 5",
    packageId: 1,
    isActive: true,
    hasFault: false,
    isArchived: false,
    price: "15 د.ل",
    createdAt: "2026/05/10 — 14:32",
    updated: "2026/05/10 — 14:32",
  },
  {
    id: 2,
    name: "XBOX-01",
    type: "xbox",
    typeLabel: "Xbox",
    packageId: 3,
    isActive: true,
    hasFault: false,
    isArchived: false,
    price: "12 د.ل",
    createdAt: "2026/05/10 — 13:05",
    updated: "2026/05/10 — 13:05",
  },
  {
    id: 3,
    name: "PS5-02",
    type: "ps5",
    typeLabel: "PlayStation 5",
    packageId: 1,
    isActive: true,
    hasFault: true,
    isArchived: false,
    price: "18 د.ل",
    createdAt: "2026/05/09 — 22:18",
    updated: "2026/05/09 — 22:18",
  },
  {
    id: 4,
    name: "PC-01",
    type: "pc",
    typeLabel: "PC Gaming",
    packageId: 4,
    isActive: false,
    hasFault: false,
    isArchived: false,
    price: "10 د.ل",
    createdAt: "2026/05/08 — 09:40",
    updated: "2026/05/08 — 09:40",
  },
  {
    id: 5,
    name: "PS5-03",
    type: "ps5",
    typeLabel: "PlayStation 5",
    packageId: 2,
    isActive: false,
    hasFault: false,
    isArchived: false,
    price: "8 د.ل",
    createdAt: "2026/05/01 — 11:00",
    updated: "2026/05/01 — 11:00",
  },
  {
    id: 6,
    name: "XBOX-02",
    type: "xbox",
    typeLabel: "Xbox",
    packageId: 3,
    isActive: true,
    hasFault: false,
    isArchived: false,
    price: "11 د.ل",
    createdAt: "2026/05/10 — 16:20",
    updated: "2026/05/10 — 16:20",
  },
  {
    id: 7,
    name: "VR-01",
    type: "vr",
    typeLabel: "VR",
    packageId: 2,
    isActive: true,
    hasFault: false,
    isArchived: false,
    price: "20 د.ل",
    createdAt: "2026/05/11 — 10:00",
    updated: "2026/05/11 — 10:00",
  },
];

function normalizeDevice(row) {
  const packageId =
    row.packageId != null && row.packageId !== "" ? Number(row.packageId) : null;
  return {
    ...row,
    packageId: Number.isFinite(packageId) ? packageId : null,
    hasFault: Boolean(row.hasFault),
    maintenanceInProgress: Boolean(row.maintenanceInProgress),
    isActive: row.isActive !== false,
    isArchived: Boolean(row.isArchived),
    archivedAt: row.archivedAt || null,
    image: row.image || null,
    notes: row.notes ?? "",
    createdAt: row.createdAt || row.updated || "—",
    typeLabel: row.typeLabel || typeLabelFromType(row.type),
  };
}

/** اسم الباقة المرتبطة بالجهاز — يتحدّث تلقائياً عند تعديل الباقات */
export function getDevicePackageLabel(packageId, packages) {
  if (packageId == null) return "—";
  const pkg = (packages || []).find((p) => p.id === packageId);
  if (!pkg) return "باقة غير متوفرة";
  return pkg.name || "—";
}

/** أجهزة مرتبطة بباقة (من packageId على الجهاز في لوحة المدير) */
export function getDevicesLinkedToPackage(packageId, devices) {
  if (packageId == null) return [];
  return (devices || []).filter((d) => d.packageId === packageId && !d.isArchived);
}

export function getPrimaryDeviceNameForPackage(packageId, devices) {
  const linked = getDevicesLinkedToPackage(packageId, devices);
  if (!linked.length) return "—";
  return linked.map((d) => d.name).join("، ");
}

function readRawDeviceList() {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      try {
        localStorage.setItem(STORAGE_KEY, raw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) && parsed.length ? parsed : null;
}

function applyDeviceNameMigration(list) {
  const normalized = list.map(normalizeDevice);
  const { devices, idToName, changed } = migrateDevicesToCodeNames(normalized);
  if (changed) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devices.map(normalizeDevice)));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    syncFaultRecordsDeviceNames(idToName);
    notifyDevicesUpdated();
  }
  return devices.map(normalizeDevice);
}

/** تحديث أسماء الأجهزة في سجل الأعطال بعد الترحيل */
function syncFaultRecordsDeviceNames(idToName) {
  if (!idToName?.size) return;
  try {
    const FAULT_KEY = "zones-maintenance-faults-v4";
    const raw = localStorage.getItem(FAULT_KEY);
    if (!raw) return;
    const faults = JSON.parse(raw);
    if (!Array.isArray(faults)) return;
    const next = faults.map((f) => {
      const newName = idToName.get(f.deviceId);
      return newName ? { ...f, deviceName: newName } : f;
    });
    localStorage.setItem(FAULT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function loadDevices() {
  try {
    const stored = readRawDeviceList();
    if (!stored) return DEFAULT_DEVICES.map(normalizeDevice);
    return applyDeviceNameMigration(stored);
  } catch {
    return DEFAULT_DEVICES.map(normalizeDevice);
  }
}

export function loadActiveDevices() {
  return loadDevices().filter((d) => !d.isArchived);
}

/** نفس منطق جدول المدير: غير مؤرشف + مفعّل (isActive) */
export function loadManagerEnabledDevices() {
  return loadDevices()
    .filter((d) => !d.isArchived && d.isActive !== false)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "en", { numeric: true }));
}

export function loadArchivedDevices() {
  return loadDevices().filter((d) => d.isArchived);
}

export function saveDevices(list) {
  try {
    const serialized = JSON.stringify(list.map(normalizeDevice));
    const prev = localStorage.getItem(STORAGE_KEY);
    if (prev === serialized) return;
    localStorage.setItem(STORAGE_KEY, serialized);
    notifyDevicesUpdated();
  } catch {
    /* ignore */
  }
}

export function nextDeviceId(list) {
  return list.reduce((max, d) => Math.max(max, d.id ?? 0), 0) + 1;
}

export function setDeviceFault(deviceId, hasFault) {
  const list = loadDevices();
  const next = list.map((d) =>
    d.id === deviceId
      ? { ...d, hasFault, maintenanceInProgress: hasFault ? d.maintenanceInProgress : false }
      : d,
  );
  saveDevices(next);
  return next;
}

export function setDeviceActive(deviceId, isActive) {
  const list = loadDevices();
  const next = list.map((d) => (d.id === deviceId ? { ...d, isActive } : d));
  saveDevices(next);
  return next;
}

/** تحديث حالة التشغيل والعطل في عملية حفظ واحدة — يمنع فقدان البيانات بين استدعاءين */
export function setMaintenanceDeviceStatus(deviceId, isActive, { hasPendingFault = false } = {}) {
  const list = loadDevices();
  const next = list.map((d) => {
    if (d.id !== deviceId) return d;
    if (!isActive) {
      return { ...d, isActive: false, hasFault: true, maintenanceInProgress: false };
    }
    if (hasPendingFault) {
      return { ...d, isActive: true, hasFault: true };
    }
    return { ...d, isActive: true, hasFault: false, maintenanceInProgress: false };
  });
  saveDevices(next);
  return next;
}

export function startDeviceMaintenance(deviceId) {
  const list = loadDevices();
  const next = list.map((d) =>
    d.id === deviceId
      ? { ...d, isActive: false, hasFault: true, maintenanceInProgress: true }
      : d,
  );
  saveDevices(next);
  return next;
}

export function endDeviceMaintenance(deviceId) {
  const list = loadDevices();
  const next = list.map((d) =>
    d.id === deviceId
      ? { ...d, isActive: true, hasFault: false, maintenanceInProgress: false }
      : d,
  );
  saveDevices(next);
  return next;
}

export { suggestDeviceName, typeLabelFromType };
