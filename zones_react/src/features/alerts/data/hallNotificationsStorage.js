import {
  buildBookingsStartNotificationText,
  buildBookingsStopNotificationText,
  getHallDisplayName,
} from "./bookingsStopMessages";
import { formatAlertDateTime } from "./alertsMeta";

const STORAGE_KEY = "zones-hall-notifications-v1";
export const HALL_NOTIFICATIONS_EVENT = "zones-hall-notifications-updated";

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HALL_NOTIFICATIONS_EVENT));
}

export function loadHallNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHallNotifications(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    notifyUpdated();
  } catch {
    /* ignore */
  }
}

function nextNotificationId(list) {
  return list.reduce((max, row) => Math.max(max, row.id ?? 0), 5000) + 1;
}

/** @param {'reception'|'maintenance'|'customer'} audience */
export function getNotificationsForAudience(audience) {
  return loadHallNotifications().filter((row) => {
    const audiences = row.audiences ?? [];
    if (audiences.includes("all")) return true;
    return audiences.includes(audience);
  });
}

export function pushManagerAlertNotification(alert) {
  if (!alert) return null;

  const targetCategories = alert.targetCategories ?? [];
  const audiences = targetCategories.includes("all")
    ? ["all"]
    : targetCategories.filter(Boolean);

  const messageParts = [alert.name, alert.situationDescription].filter(Boolean);
  const instructions = alert.alternativeInstructions?.trim();

  const list = loadHallNotifications();
  const row = {
    id: nextNotificationId(list),
    type: "manager_alert",
    alertId: alert.id,
    severity: alert.severity || "medium",
    name: alert.name,
    message: messageParts.join(" — "),
    instructions: instructions || "",
    audiences: audiences.length ? audiences : ["all"],
    createdAt: formatAlertDateTime(),
  };
  saveHallNotifications([row, ...list]);
  return row;
}

export function pushBookingsStopNotification({ hallName, reason = "" } = {}) {
  const name = hallName || getHallDisplayName();
  const list = loadHallNotifications();
  const row = {
    id: nextNotificationId(list),
    type: "bookings_stop",
    hallName: name,
    reason: reason.trim(),
    message: buildBookingsStopNotificationText(name),
    audiences: ["reception", "maintenance", "customer"],
    createdAt: formatAlertDateTime(),
  };
  saveHallNotifications([row, ...list]);
  return row;
}

export function pushBookingsStartNotification({ hallName } = {}) {
  const name = hallName || getHallDisplayName();
  const list = loadHallNotifications();
  const row = {
    id: nextNotificationId(list),
    type: "bookings_start",
    hallName: name,
    reason: "",
    message: buildBookingsStartNotificationText(name),
    audiences: ["reception", "maintenance", "customer"],
    createdAt: formatAlertDateTime(),
  };
  saveHallNotifications([row, ...list]);
  return row;
}
