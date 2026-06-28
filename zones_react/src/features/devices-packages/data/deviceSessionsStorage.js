import { hallScopedKey } from "../../../shared/tenant/hallScopedStorage";

const BASE_KEY = "zones-device-sessions-v2";
const storageKey = () => hallScopedKey(BASE_KEY);

export const DEVICE_SESSIONS_EVENT = "zones-device-sessions-updated";

function notifySessionsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEVICE_SESSIONS_EVENT));
}

const DEFAULT_SESSIONS = [];

function normalizeSession(row) {
  return {
    id: row.id,
    deviceId: row.deviceId,
    bookedAt: row.bookedAt,
  };
}

export function loadDeviceSessions() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [];
    return parsed.map(normalizeSession);
  } catch {
    return [];
  }
}

export function saveDeviceSessions(list) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(list.map(normalizeSession)));
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

import { getActiveStaffSession, isApiStaffSession } from "../../devices-packages/data/hallCatalogSync";

export function getDeviceSessionsThisMonth(deviceId, deviceRow) {
  if (deviceRow?.sessionsThisMonth != null) return deviceRow.sessionsThisMonth;
  if (isApiStaffSession(getActiveStaffSession())) return 0;
  return loadDeviceSessions().filter((s) => s.deviceId === deviceId && isCurrentMonth(s.bookedAt)).length;
}

export function getDeviceLastActivity(deviceId, deviceRow) {
  if (deviceRow?.lastSessionAt) return formatActivityDate(deviceRow.lastSessionAt);
  if (isApiStaffSession(getActiveStaffSession())) return "—";
  const sessions = loadDeviceSessions().filter((s) => s.deviceId === deviceId);
  if (!sessions.length) return "—";
  const latest = sessions.reduce((a, b) =>
    new Date(a.bookedAt) > new Date(b.bookedAt) ? a : b,
  );
  return formatActivityDate(latest.bookedAt);
}
