import {
  DEFAULT_WORK_HOURS_FROM,
  DEFAULT_WORK_HOURS_TO,
  formatHallWorkHours,
  loadManagerHall,
} from "../../lounge/data/managerHallStorage";
import { isDeviceBroken, loadSyncedActiveDevices } from "../../devices-packages/utils/deviceFaultSync";
import { findCalendarSlot, SLOT_STATUS } from "../data/receptionCalendarStorage";

export const CELL_KIND = {
  maintenance: "maintenance",
  reserved: "reserved",
  available: "available",
  active: "active",
};

export const CELL_META = {
  maintenance: { label: "صيانة", hint: "الجهاز تحت الصيانة — مرتبط ببيانات المدير", className: "rcal-cell--maintenance" },
  reserved: { label: "محجوز", hint: "حجز زبون — اضغط لعرض التفاصيل", className: "rcal-cell--reserved" },
  available: { label: "متاح", hint: "متاح للحجز — اضغط لحجز زبون", className: "rcal-cell--available" },
  active: { label: "نشط", hint: "جلسة نشطة — للعرض فقط", className: "rcal-cell--active" },
};

/** هل الجهاز في حالة صيانة (مرتبط بمدير الصالة + سجل الأعطال) */
export function isDeviceInMaintenance(device) {
  if (!device) return true;
  return Boolean(device.maintenanceInProgress) || isDeviceBroken(device) || !device.isActive;
}

export function buildWorkHourSlots(from = DEFAULT_WORK_HOURS_FROM, to = DEFAULT_WORK_HOURS_TO) {
  const fromH = Number.parseInt(String(from).split(":")[0], 10);
  const toH = Number.parseInt(String(to).split(":")[0], 10);
  if (!Number.isFinite(fromH) || !Number.isFinite(toH)) {
    return buildWorkHourSlots(DEFAULT_WORK_HOURS_FROM, DEFAULT_WORK_HOURS_TO);
  }

  const slots = [];
  let h = fromH;
  let guard = 0;

  while (guard < 25) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h === toH) break;
    h = (h + 1) % 24;
    guard += 1;
  }

  return slots;
}

export function getHallWorkHours() {
  const hall = loadManagerHall();
  const from = hall.workHoursFrom || DEFAULT_WORK_HOURS_FROM;
  const to = hall.workHoursTo || DEFAULT_WORK_HOURS_TO;
  return {
    from,
    to,
    label: formatHallWorkHours(from, to),
    hallName: hall.hallName || "الصالة",
  };
}

export function loadCalendarDevices() {
  return loadSyncedActiveDevices().map((d) => ({
    ...d,
    _maintenance: isDeviceInMaintenance(d),
  }));
}

export function resolveCellKind(device, date, hour, slots) {
  if (isDeviceInMaintenance(device)) return CELL_KIND.maintenance;

  const slot = findCalendarSlot(device.id, date, hour, slots);
  if (!slot) return CELL_KIND.available;
  if (slot.status === SLOT_STATUS.active) return CELL_KIND.active;
  if (slot.status === SLOT_STATUS.reserved) return CELL_KIND.reserved;
  return CELL_KIND.available;
}

export function formatCalendarDate(dateStr) {
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    return d.toLocaleDateString("ar-LY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
