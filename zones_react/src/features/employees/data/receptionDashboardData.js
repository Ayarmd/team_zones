import { loadSyncedActiveDevices, isDeviceBroken } from "../../devices-packages/utils/deviceFaultSync";
import { formatChartWeekdayLabel } from "../../../shared/utils/chartDayLabels";
import {
  ATTENDANCE_STATUS,
  BOOKING_SOURCES,
  getActiveCalendarSessions,
  getSessionBookings,
  getTodayBookedSlots,
  loadCalendarSlots,
  RECEPTION_CALENDAR_EVENT,
  SLOT_STATUS,
  todayIso,
} from "./receptionCalendarStorage";
import { DEVICES_STORAGE_EVENT } from "../../devices-packages/data/devicesStorage";

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      label: formatChartWeekdayLabel(d),
    });
  }
  return days;
}

function isCalendarBooking(slot) {
  return slot.status === SLOT_STATUS.reserved || slot.status === SLOT_STATUS.active;
}

function isAppBooking(slot) {
  if (slot.source === BOOKING_SOURCES.app.value) return true;
  const code = String(slot.bookingCode || slot.visitorNumber || "");
  return code.startsWith(`${BOOKING_SOURCES.app.prefix}-`);
}

function buildDailyBookingsChart(slots) {
  return last7Days().map(({ iso, label }) => {
    const dayBookings = slots.filter((s) => s.date === iso && isCalendarBooking(s));
    const app = dayBookings.filter(isAppBooking).length;
    const manual = dayBookings.length - app;
    return { label, app, manual, total: dayBookings.length };
  });
}

export function getReceptionDashboardView() {
  const slots = loadCalendarSlots();
  const devices = loadSyncedActiveDevices();
  const today = todayIso();

  const availableDevices = devices.filter(
    (d) => d.isActive !== false && !d.isArchived && !isDeviceBroken(d) && !d.maintenanceInProgress,
  ).length;
  const todayBookings = getTodayBookedSlots(slots).length;
  const todaySessions = slots.filter(
    (s) =>
      s.date === today &&
      (s.status === SLOT_STATUS.active || s.attendanceStatus === ATTENDANCE_STATUS.checkedIn),
  ).length;

  return {
    kpis: {
      availableDevices,
      todayBookings,
      todaySessions,
    },
    dailyBookingsChart: buildDailyBookingsChart(slots),
    activeSessions: getActiveCalendarSessions(slots).length,
    openBookings: getSessionBookings(slots).length,
  };
}

export const RECEPTION_DASHBOARD_EVENTS = [
  RECEPTION_CALENDAR_EVENT,
  DEVICES_STORAGE_EVENT,
  "zones-maintenance-faults-updated",
];
