import { loadCalendarSlots, SLOT_STATUS } from "../../employees/data/receptionCalendarStorage";
import { getSuperAdminState, updateSystemSettings } from "./superAdminStorage";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function isMaintenanceModeEnabled() {
  return Boolean(getSuperAdminState().systemSettings?.maintenanceMode);
}

export function countActiveBookingsToday() {
  const today = todayIso();
  return loadCalendarSlots().filter(
    (slot) =>
      slot.date === today &&
      (slot.status === SLOT_STATUS.reserved || slot.status === SLOT_STATUS.active),
  ).length;
}

export function getUpcomingCustomerBookingsToday() {
  const today = todayIso();
  return loadCalendarSlots().filter(
    (slot) =>
      slot.date === today &&
      slot.status === SLOT_STATUS.reserved &&
      (slot.source === "app" || String(slot.bookingCode || "").startsWith("APP-")),
  );
}

export function activateMaintenanceMode({ notifyCustomers = false } = {}) {
  const notifiedCount = notifyCustomers ? getUpcomingCustomerBookingsToday().length : 0;

  const settings = updateSystemSettings({
    maintenanceMode: true,
    maintenanceActivatedAt: new Date().toISOString(),
    maintenanceNotifyCustomers: notifyCustomers,
    maintenanceNotificationsCount: notifiedCount,
  });

  return {
    settings,
    notifiedCount,
    activeBookings: countActiveBookingsToday(),
  };
}

export function deactivateMaintenanceMode() {
  return updateSystemSettings({
    maintenanceMode: false,
    maintenanceActivatedAt: null,
    maintenanceNotifyCustomers: false,
  });
}

export const MAINTENANCE_ACCESS_RULES = [
  { role: "الزبون (التطبيق)", access: "blocked", tone: "red" },
  { role: "موظف الاستقبال", access: "blocked", tone: "amber" },
  { role: "موظف الصيانة", access: "blocked", tone: "amber" },
  { role: "مدير الصالة / الأدمن", access: "allowed", tone: "green" },
];
