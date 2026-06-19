import { loadDevices } from "../../devices-packages/data/devicesStorage";
import { formatFaultDateTime } from "./faultMeta";

const STORAGE_KEY = "zones-maintenance-faults-v5";
export const MAINTENANCE_FAULTS_EVENT = "zones-maintenance-faults-updated";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function faultDate(y, m, d, hour = 10, minute = 0) {
  return `${y}/${pad2(m)}/${pad2(d)} — ${pad2(hour)}:${pad2(minute)}`;
}

function buildSeedFaults() {
  const y = new Date().getFullYear();
  const m = new Date().getMonth() + 1;
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;

  return [
    { id: 1001, deviceId: 3, deviceName: "PS5-02", deviceType: "ps5", deviceTypeLabel: "PlayStation 5", faultType: "controller", status: "pending", createdAt: faultDate(y, m, 4, 20, 15), resolvedAt: "", maintenanceCost: 0, maintenanceEmployeeName: "خالد بوزريدة", archived: false },
    { id: 1002, deviceId: 1, deviceName: "PS5-01", deviceType: "ps5", deviceTypeLabel: "PlayStation 5", faultType: "screen", status: "resolved", createdAt: faultDate(y, m, 2, 14, 30), resolvedAt: faultDate(y, m, 3, 10, 0), maintenanceCost: 120, maintenanceEmployeeName: "خالد بوزريدة", archived: false },
    { id: 1003, deviceId: 5, deviceName: "PS5-03", deviceType: "ps5", deviceTypeLabel: "PlayStation 5", faultType: "network", status: "resolved", createdAt: faultDate(y, m, 5, 11, 0), resolvedAt: faultDate(y, m, 6, 9, 30), maintenanceCost: 0, maintenanceEmployeeName: "خالد بوزريدة", archived: false },
    { id: 1004, deviceId: 2, deviceName: "XBOX-01", deviceType: "xbox", deviceTypeLabel: "Xbox", faultType: "audio", status: "resolved", createdAt: faultDate(y, m, 7, 16, 45), resolvedAt: faultDate(y, m, 8, 11, 0), maintenanceCost: 80, maintenanceEmployeeName: "خالد بوزريدة", archived: false },
    { id: 1007, deviceId: 7, deviceName: "VR-01", deviceType: "vr", deviceTypeLabel: "VR", faultType: "screen", status: "pending", createdAt: faultDate(y, m, 14, 18, 0), resolvedAt: "", maintenanceCost: 0, maintenanceEmployeeName: "", archived: false },
    { id: 1008, deviceId: 4, deviceName: "PC-01", deviceType: "pc", deviceTypeLabel: "PC Gaming", faultType: "power", status: "pending", createdAt: faultDate(y, m, 11, 9, 30), resolvedAt: "", maintenanceCost: 0, maintenanceEmployeeName: "خالد بوزريدة", archived: false },
    { id: 1009, deviceId: 5, deviceName: "PS5-03", deviceType: "ps5", deviceTypeLabel: "PlayStation 5", faultType: "controller", status: "pending", createdAt: faultDate(y, m, 12, 15, 0), resolvedAt: "", maintenanceCost: 0, maintenanceEmployeeName: "خالد بوزريدة", archived: false },
    { id: 1011, deviceId: 2, deviceName: "XBOX-01", deviceType: "xbox", deviceTypeLabel: "Xbox", faultType: "power", status: "resolved", createdAt: faultDate(prevY, prevM, 8, 9, 0), resolvedAt: faultDate(prevY, prevM, 10, 14, 0), maintenanceCost: 90, maintenanceEmployeeName: "خالد بوزريدة", archived: true, archivedAt: faultDate(prevY, prevM, 12, 10, 0) },
    { id: 1012, deviceId: 6, deviceName: "XBOX-02", deviceType: "xbox", deviceTypeLabel: "Xbox", faultType: "network", status: "pending", createdAt: faultDate(prevY, prevM, 5, 14, 0), resolvedAt: "", maintenanceCost: 0, maintenanceEmployeeName: "خالد بوزريدة", archived: true, archivedAt: faultDate(prevY, prevM, 20, 11, 0) },
  ];
}

function lookupDeviceTypeLabel(deviceId, deviceName) {
  const devices = loadDevices();
  const device = devices.find((d) => d.id === deviceId) || devices.find((d) => d.name === deviceName);
  return device ? { type: device.type, typeLabel: device.typeLabel } : { type: "", typeLabel: "—" };
}

function normalizeFault(row) {
  const legacy = lookupDeviceTypeLabel(row.deviceId, row.deviceName);
  return {
    ...row,
    archived: Boolean(row.archived),
    maintenanceCost: Number(row.maintenanceCost) || 0,
    deviceType: row.deviceType || legacy.type,
    deviceTypeLabel: row.deviceTypeLabel || legacy.typeLabel,
    resolvedAt: row.resolvedAt || (row.status === "resolved" ? row.archivedAt || "" : ""),
  };
}

export function loadFaults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedFaults().map(normalizeFault);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return buildSeedFaults().map(normalizeFault);
    return parsed.map(normalizeFault);
  } catch {
    return buildSeedFaults().map(normalizeFault);
  }
}

export function saveFaults(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.map(normalizeFault)));
    window.dispatchEvent(new Event(MAINTENANCE_FAULTS_EVENT));
  } catch {
    /* ignore */
  }
}

export function nextFaultId(list) {
  const all = list.length ? list : loadFaults();
  const base = all.reduce((max, f) => Math.max(max, f.id ?? 0), 1000);
  return base + 1;
}

export function getActiveFaults() {
  return loadFaults().filter((f) => !f.archived);
}

/** الأعطال الحالية — معلّقة فقط لأجهزة الصالة غير المؤرشفة */
export function getCurrentFaults() {
  const deviceIds = new Set(
    loadDevices()
      .filter((d) => !d.isArchived)
      .map((d) => d.id),
  );
  return loadFaults().filter(
    (f) => !f.archived && f.status === "pending" && deviceIds.has(f.deviceId),
  );
}

export function getArchivedFaults() {
  const deviceIds = new Set(loadDevices().map((d) => d.id));
  return loadFaults().filter(
    (f) => f.archived && f.status === "resolved" && deviceIds.has(f.deviceId),
  );
}

export function getLatestPendingFaultForDevice(deviceId) {
  const pending = loadFaults().filter(
    (f) => !f.archived && f.deviceId === deviceId && f.status === "pending",
  );
  if (!pending.length) return null;
  return pending.reduce((a, b) => ((a.id ?? 0) > (b.id ?? 0) ? a : b));
}

export function addFault(payload) {
  const list = loadFaults();
  const fault = normalizeFault({
    id: nextFaultId(list),
    deviceId: payload.deviceId,
    deviceName: payload.deviceName,
    deviceType: payload.deviceType,
    deviceTypeLabel: payload.deviceTypeLabel,
    faultType: payload.faultType,
    faultTypeCustom: payload.faultTypeCustom?.trim() || "",
    status: payload.status || "pending",
    createdAt: payload.createdAt || formatFaultDateTime(),
    resolvedAt: payload.resolvedAt || "",
    maintenanceCost: payload.maintenanceCost ?? 0,
    maintenanceEmployeeName: payload.maintenanceEmployeeName || "",
    details: payload.details?.trim() || "",
    archived: false,
  });
  const next = [...list, fault];
  saveFaults(next);
  return fault;
}

export function updateFault(id, patch) {
  const list = loadFaults();
  const next = list.map((f) => (f.id === id ? normalizeFault({ ...f, ...patch }) : f));
  saveFaults(next);
  return next.find((f) => f.id === id) ?? null;
}

export function resolveFault(id) {
  return updateFault(id, {
    status: "resolved",
    resolvedAt: formatFaultDateTime(),
  });
}

export function archiveFault(id) {
  return updateFault(id, {
    archived: true,
    archivedAt: formatFaultDateTime(),
  });
}

export function resolveLatestActiveFaultForDevice(deviceId) {
  const list = loadFaults();
  const pending = list.filter(
    (f) => !f.archived && f.deviceId === deviceId && f.status === "pending",
  );
  if (!pending.length) return null;
  const latest = pending.reduce((a, b) => ((a.id ?? 0) > (b.id ?? 0) ? a : b));
  return updateFault(latest.id, { status: "resolved", resolvedAt: formatFaultDateTime() });
}

/** إنهاء العطل وأرشفته — يُزال الجهاز من المعطلة ويعود متاحاً في التقويم */
export function resolveAndArchiveFaultForDevice(deviceId, maintenanceCost = 0) {
  const list = loadFaults();
  const pending = list.filter(
    (f) => !f.archived && f.deviceId === deviceId && f.status === "pending",
  );
  if (!pending.length) return null;
  const latest = pending.reduce((a, b) => ((a.id ?? 0) > (b.id ?? 0) ? a : b));
  const now = formatFaultDateTime();
  return updateFault(latest.id, {
    status: "resolved",
    resolvedAt: now,
    maintenanceCost: Number(maintenanceCost) || 0,
    archived: true,
    archivedAt: now,
  });
}
