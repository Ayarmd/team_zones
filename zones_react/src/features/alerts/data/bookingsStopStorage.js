import { formatAlertDateTime } from "./alertsMeta";
import { addAlert, loadAlerts, stopAlert } from "./managerAlertsStorage";
import {
  BOOKINGS_STOP_NAME,
  getHallDisplayName,
} from "./bookingsStopMessages";
import {
  pushBookingsStartNotification,
  pushBookingsStopNotification,
} from "./hallNotificationsStorage";

const STORAGE_KEY = "zones-bookings-stop-v1";
export const BOOKINGS_STOP_EVENT = "zones-bookings-stop-updated";

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BOOKINGS_STOP_EVENT));
}

function normalizeRecord(row) {
  return {
    ...row,
    name: BOOKINGS_STOP_NAME,
    reason: row.reason?.trim() || "",
    endDate: row.endDate || "",
    status: row.status === "active" ? "active" : "ended",
    hallName: row.hallName || getHallDisplayName(),
  };
}

function readStoredRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRecord);
  } catch {
    return [];
  }
}

function getLegacyBookingsStopAlerts() {
  return loadAlerts().filter((row) => row.source === "bookings_stop");
}

function getLegacyActiveBookingsStopAlert() {
  return (
    getLegacyBookingsStopAlerts().find((row) => row.status === "active") ?? null
  );
}

/** ينقل سجلات إيقاف الحجوزات القديمة من سجل التنبيهات إلى التخزين الجديد */
function migrateLegacyBookingsStopRecords() {
  const current = readStoredRecords();
  if (current.length > 0) return current;

  const legacy = getLegacyBookingsStopAlerts();
  if (legacy.length === 0) return [];

  const hallName = getHallDisplayName();
  let nextId = 2001;
  const migrated = legacy.map((alert) =>
    normalizeRecord({
      id: nextId++,
      name: BOOKINGS_STOP_NAME,
      reason: alert.situationDescription || alert.message || "",
      hallName,
      status: alert.status === "active" ? "active" : "ended",
      startDate: alert.startDate || formatAlertDateTime(),
      endDate: alert.endDate || "",
      alertId: alert.id,
    }),
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated.map(normalizeRecord)));
    notifyUpdated();
  } catch {
    /* ignore */
  }

  return migrated.map(normalizeRecord);
}

export function loadBookingsStopRecords() {
  const migrated = migrateLegacyBookingsStopRecords();
  if (migrated.length > 0) return migrated;
  return readStoredRecords();
}

function saveBookingsStopRecords(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.map(normalizeRecord)));
    notifyUpdated();
  } catch {
    /* ignore */
  }
}

export function nextBookingsStopId(list = loadBookingsStopRecords()) {
  return list.reduce((max, row) => Math.max(max, row.id ?? 0), 2000) + 1;
}

export function formatBookingsStopCode(id) {
  return `H-${String(id ?? 0).padStart(4, "0")}`;
}

export function getActiveBookingsStopRecord() {
  const active =
    loadBookingsStopRecords().find((row) => row.status === "active") ?? null;
  if (active) return active;

  const legacy = getLegacyActiveBookingsStopAlert();
  if (!legacy) return null;

  return normalizeRecord({
    id: legacy.id,
    name: BOOKINGS_STOP_NAME,
    reason: legacy.situationDescription || legacy.message || "",
    status: "active",
    startDate: legacy.startDate || formatAlertDateTime(),
    endDate: "",
    alertId: legacy.id,
  });
}

export function isBookingsStopped() {
  return Boolean(getActiveBookingsStopRecord());
}

export function getBookingsStopBlockMessage() {
  const hallName = getHallDisplayName();
  return `الحجوزات متوقفة حالياً في صالة ${hallName}. لا يمكن إضافة حجز جديد حتى يُعلن المدير عن بدء الحجوزات.`;
}

export function startBookingsStop({ reason = "" } = {}) {
  const existing = getActiveBookingsStopRecord();
  if (existing) {
    return { ok: false, error: "الحجوزات متوقفة بالفعل.", record: existing };
  }

  const hallName = getHallDisplayName();
  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return { ok: false, error: "يرجى اختيار سبب إيقاف الحجوزات." };
  }

  const list = loadBookingsStopRecords();
  const record = normalizeRecord({
    id: nextBookingsStopId(list),
    name: BOOKINGS_STOP_NAME,
    reason: trimmedReason,
    hallName,
    status: "active",
    startDate: formatAlertDateTime(),
    endDate: "",
    alertId: null,
  });

  const notification = pushBookingsStopNotification({ hallName, reason: trimmedReason });

  const alert = addAlert({
    name: BOOKINGS_STOP_NAME,
    targetCategories: ["reception", "maintenance", "customer"],
    severity: "high",
    situationDescription: trimmedReason,
    alternativeInstructions: notification.message,
    source: "bookings_stop",
  });

  record.alertId = alert.id;
  saveBookingsStopRecords([record, ...list]);

  return { ok: true, record };
}

export function resumeBookingsStop() {
  const active = getActiveBookingsStopRecord();
  if (!active) {
    return { ok: false, error: "لا يوجد إيقاف نشط للحجوزات." };
  }

  const hallName = active.hallName || getHallDisplayName();
  const endDate = formatAlertDateTime();
  const list = loadBookingsStopRecords().map((row) =>
    row.id === active.id ? { ...row, status: "ended", endDate } : row,
  );
  saveBookingsStopRecords(list);

  if (active.alertId) {
    stopAlert(active.alertId);
  }

  pushBookingsStartNotification({ hallName });
  return { ok: true, record: { ...active, status: "ended", endDate } };
}

/** توافق مع التخزين القديم */
export function getActiveBookingsStopAlert() {
  const record = getActiveBookingsStopRecord();
  if (!record) return null;
  return {
    id: record.alertId || record.id,
    name: record.name,
    startDate: record.startDate,
    reason: record.reason,
  };
}

export function endBookingsStop() {
  return resumeBookingsStop();
}
