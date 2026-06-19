import { loadEmployees, EMPLOYEES_STORAGE_EVENT } from "../../employees/data/employeesStorage";
import { loadSyncedActiveDevices, isDeviceBroken } from "../../devices-packages/utils/deviceFaultSync";
import { DEVICES_STORAGE_EVENT } from "../../devices-packages/data/devicesStorage";
import {
  BOOKING_REVENUE_EVENT,
  formatRevenueDayDelta,
  getTodayRevenueSummary,
} from "../../employees/data/bookingRevenueStorage";
import { RECEPTION_CALENDAR_EVENT } from "../../employees/data/receptionCalendarStorage";
import { formatCurrency } from "../../finance/utils/financeData";

export const MANAGER_DASHBOARD_EVENTS = [
  RECEPTION_CALENDAR_EVENT,
  BOOKING_REVENUE_EVENT,
  DEVICES_STORAGE_EVENT,
  EMPLOYEES_STORAGE_EVENT,
];

export function getManagerDashboardKpis() {
  const devices = loadSyncedActiveDevices();
  const availableDevices = devices.filter(
    (d) => d.isActive !== false && !d.isArchived && !isDeviceBroken(d) && !d.maintenanceInProgress,
  ).length;

  const employees = loadEmployees().filter((e) => !e.isArchived).length;
  const { todayTotal, deltaPct } = getTodayRevenueSummary();

  return {
    availableDevices,
    totalDevices: devices.filter((d) => !d.isArchived).length,
    employees,
    todayRevenue: todayTotal,
    todayRevenueLabel: formatCurrency(todayTotal),
    revenueHint: formatRevenueDayDelta(deltaPct),
    devicesHint: `${availableDevices} متاح للعب`,
    employeesHint: `${employees} موظف نشط`,
  };
}
