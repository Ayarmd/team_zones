const STORAGE_KEY = "zones-device-sessions-v1";

export const DEVICE_SESSIONS_EVENT = "zones-device-sessions-updated";

function notifySessionsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEVICE_SESSIONS_EVENT));
}

/** جلسات تجريبية — يُحدَّث العدد تلقائياً عند إضافة حجوزات جديدة */
const DEFAULT_SESSIONS = [
  { id: 1, deviceId: 1, bookedAt: "2026-06-01T14:30:00" },
  { id: 2, deviceId: 1, bookedAt: "2026-06-03T18:00:00" },
  { id: 3, deviceId: 1, bookedAt: "2026-06-05T20:15:00" },
  { id: 4, deviceId: 1, bookedAt: "2026-06-07T16:45:00" },
  { id: 5, deviceId: 2, bookedAt: "2026-06-02T11:00:00" },
  { id: 6, deviceId: 2, bookedAt: "2026-06-06T19:30:00" },
  { id: 7, deviceId: 3, bookedAt: "2026-06-04T22:00:00" },
  { id: 8, deviceId: 6, bookedAt: "2026-06-08T10:00:00" },
  { id: 9, deviceId: 6, bookedAt: "2026-06-08T15:20:00" },
  { id: 10, deviceId: 7, bookedAt: "2026-05-28T12:00:00" },
];

function normalizeSession(row) {
  return {
    id: row.id,
    deviceId: row.deviceId,
    bookedAt: row.bookedAt,
  };
}

export function loadDeviceSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SESSIONS.map(normalizeSession);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_SESSIONS.map(normalizeSession);
    return parsed.map(normalizeSession);
  } catch {
    return DEFAULT_SESSIONS.map(normalizeSession);
  }
}

export function saveDeviceSessions(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.map(normalizeSession)));
    notifySessionsUpdated();
  } catch {
    /* ignore */
  }
}

export function addDeviceSession(deviceId, bookedAt = new Date().toISOString()) {
  const list = loadDeviceSessions();
  const id = list.reduce((max, s) => Math.max(max, s.id ?? 0), 0) + 1;
  const next = [...list, { id, deviceId, bookedAt }];
  saveDeviceSessions(next);
  return next;
}

function formatActivityDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ar-LY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
}

function isCurrentMonth(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function getDeviceSessionsThisMonth(deviceId) {
  return loadDeviceSessions().filter((s) => s.deviceId === deviceId && isCurrentMonth(s.bookedAt)).length;
}

export function getDeviceLastActivity(deviceId) {
  const sessions = loadDeviceSessions().filter((s) => s.deviceId === deviceId);
  if (!sessions.length) return "—";
  const latest = sessions.reduce((a, b) =>
    new Date(a.bookedAt) > new Date(b.bookedAt) ? a : b,
  );
  return formatActivityDate(latest.bookedAt);
}
