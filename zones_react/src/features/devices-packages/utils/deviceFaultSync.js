import {
  getLatestPendingFaultForDevice,
  loadFaults,
} from "../../maintenance/data/maintenanceFaultsStorage";
import { faultTypeLabel } from "../../maintenance/data/faultMeta";
import { loadDevices, saveDevices } from "../data/devicesStorage";

/** أجهزة لها عطل معلّق في سجل الأعطال */
export function getPendingFaultDeviceIds() {
  return new Set(
    loadFaults()
      .filter((f) => !f.archived && f.status === "pending")
      .map((f) => f.deviceId),
  );
}

/** هل الجهاز في الصيانة — يعتمد على وجود عطل معلّق فقط */
export function isDeviceBroken(device) {
  if (!device) return false;
  return getPendingFaultDeviceIds().has(device.id);
}

/** هل الإصلاح جاري (بدأت الصيانة والعطل لا يزال معلّقاً) */
export function isDeviceRepairInProgress(device) {
  if (!device) return false;
  return Boolean(device.maintenanceInProgress) && getPendingFaultDeviceIds().has(device.id);
}

/** مزامنة hasFault و maintenanceInProgress مع سجل الأعطال */
export function reconcileDevicesWithFaults(devices = loadDevices()) {
  const pendingIds = getPendingFaultDeviceIds();
  let changed = false;

  const next = devices.map((d) => {
    const hasPending = pendingIds.has(d.id);
    const patch = {};

    if (Boolean(d.hasFault) !== hasPending) {
      patch.hasFault = hasPending;
    }
    if (!hasPending && d.maintenanceInProgress) {
      patch.maintenanceInProgress = false;
    }

    if (Object.keys(patch).length === 0) return d;
    changed = true;
    return { ...d, ...patch };
  });

  if (changed) saveDevices(next);
  return next;
}

/** قائمة أجهزة الصالة عند المدير — غير مؤرشفة + مزامنة الأعطال */
export function loadSyncedActiveDevices() {
  return reconcileDevicesWithFaults(loadDevices()).filter((d) => !d.isArchived);
}

/**
 * قائمة منسدلة «تسجيل عطل» — نفس أجهزة المدير (غير مؤرشفة)
 * بدون عطل معلّق حالياً
 */
export function loadSelectableDevicesForFault() {
  return loadSyncedActiveDevices()
    .filter((d) => !getLatestPendingFaultForDevice(d.id))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "en", { numeric: true }));
}

export function countBrokenDevices(devices = loadSyncedActiveDevices()) {
  return devices.filter(isDeviceBroken).length;
}

/** ملخص موحّد — المدير والصيانة يستخدمان نفس المنطق */
export function getHallFaultSummary() {
  const devices = loadSyncedActiveDevices();
  const deviceIds = new Set(devices.map((d) => d.id));
  const brokenDevices = devices.filter(isDeviceBroken);

  let waiting = 0;
  let inProgress = 0;

  for (const device of brokenDevices) {
    if (isDeviceRepairInProgress(device)) inProgress += 1;
    else waiting += 1;
  }

  const resolved = loadFaults().filter(
    (f) => f.archived && f.status === "resolved" && deviceIds.has(f.deviceId),
  ).length;

  return {
    waiting,
    inProgress,
    resolved,
    totalBroken: brokenDevices.length,
    totalDevices: devices.length,
    healthyDevices: devices.filter((d) => !isDeviceBroken(d)).length,
    devices,
  };
}

function faultRowFromDevice(device, fault) {
  return {
    id: fault?.id ?? `device-${device.id}`,
    deviceId: device.id,
    deviceName: device.name,
    deviceTypeLabel: device.typeLabel,
    faultTypeLabel: fault
      ? faultTypeLabel(fault.faultType, fault.faultTypeCustom)
      : "—",
    createdAt: fault?.createdAt ?? device.updated ?? device.createdAt,
    resolvedAt: fault?.resolvedAt,
    maintenanceCost: fault?.maintenanceCost,
  };
}

/** صفوف جداول لوحة الصيانة — مرتبطة بأجهزة المدير فقط */
export function getHallFaultTableRows(filter) {
  const { devices } = getHallFaultSummary();
  const deviceIds = new Set(devices.map((d) => d.id));

  if (filter === "resolved") {
    return loadFaults()
      .filter((f) => f.archived && f.status === "resolved" && deviceIds.has(f.deviceId))
      .sort((a, b) => new Date(b.resolvedAt || 0) - new Date(a.resolvedAt || 0))
      .map((fault) => {
        const device = devices.find((d) => d.id === fault.deviceId);
        return faultRowFromDevice(device || fault, fault);
      });
  }

  if (filter === "inProgress") {
    return devices
      .filter((d) => isDeviceRepairInProgress(d))
      .map((device) => faultRowFromDevice(device, getLatestPendingFaultForDevice(device.id)))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  if (filter === "waiting") {
    return devices
      .filter((d) => isDeviceBroken(d) && !isDeviceRepairInProgress(d))
      .map((device) => faultRowFromDevice(device, getLatestPendingFaultForDevice(device.id)))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  return [];
}

/** للعرض في الواجهة — ملخص مصدر القائمة المنسدلة */
export function getFaultDropdownDeviceStats() {
  const all = loadDevices().filter((d) => !d.isArchived);
  const selectable = loadSelectableDevicesForFault();
  const summary = getHallFaultSummary();
  return {
    totalNonArchived: all.length,
    enabledCount: all.filter((d) => d.isActive !== false).length,
    selectableCount: selectable.length,
    selectableNames: selectable.map((d) => d.name),
    inMaintenanceCount: summary.totalBroken,
  };
}
