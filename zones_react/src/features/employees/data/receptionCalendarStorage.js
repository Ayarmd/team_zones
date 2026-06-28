import {
  getBookingsStopBlockMessage,
  isBookingsStopped,
} from "../../alerts/data/bookingsStopStorage";
import { loadDevices } from "../../devices-packages/data/devicesStorage";
import { loadPackages } from "../../devices-packages/data/packagesStorage";
import {
  awardPointsForCompletedSession,
  redeemPointsForBooking,
} from "../../loyalty/data/loyaltyPointsStorage";
import { invalidateFinanceCache } from "../../finance/data/financeApiCache";
import { hallScopedKey } from "../../../shared/tenant/hallScopedStorage";
import { localTodayIso } from "../../../shared/utils/localDateUtils";
import { getActiveStaffSession, isApiStaffSession } from "../../devices-packages/data/hallCatalogSync";
import {
  apiBookCalendarSlot,
  apiCancelCalendarBooking,
  apiCheckInCalendarBooking,
  apiEndCalendarSession,
  apiMarkNoShowCalendarBooking,
  apiStartCalendarSession,
  fetchActiveReceptionCalendar,
  fetchReceptionCalendarByDate,
} from "./receptionCalendarApi";

const BASE_KEY = "zones-reception-calendar-v3";
const storageKey = () => hallScopedKey(BASE_KEY);

export const RECEPTION_CALENDAR_EVENT = "zones-reception-calendar-updated";

const LEGACY_CALENDAR_KEYS = [
  "zones-reception-calendar-v1",
  "zones-reception-calendar-v2",
];
const LEGACY_CALENDAR_PURGE_FLAG = "zones-reception-calendar-legacy-purged-v4";

function purgeLegacyCalendarStorage() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(LEGACY_CALENDAR_PURGE_FLAG)) return;
  for (const key of LEGACY_CALENDAR_KEYS) {
    localStorage.removeItem(key);
  }
  localStorage.setItem(LEGACY_CALENDAR_PURGE_FLAG, "1");
}

purgeLegacyCalendarStorage();

/** مهلة حضور 14 دقيقة بعد الموعد — تُطبَّق في Laravel (bookings:process-no-shows). */
export const NO_SHOW_GRACE_MS = 14 * 60 * 1000;

export const SLOT_STATUS = {
  reserved: "reserved",
  busy: "busy",
};

/** توافق مع بيانات محلية قديمة */
export function normalizeSlotStatus(status) {
  if (status === "active") return SLOT_STATUS.busy;
  if (status === SLOT_STATUS.busy || status === SLOT_STATUS.reserved) return status;
  return SLOT_STATUS.reserved;
}

export const ATTENDANCE_STATUS = {
  awaiting: "awaiting",
  checkedIn: "checked_in",
  noShow: "no_show",
};

export const BOOKING_STATUS = {
  ...SLOT_STATUS,
  noShow: "no_show",
};

export const PAYMENT_TYPES = {
  cash: { value: "cash", label: "الدفع عند الوصول" },
  paid: { value: "paid", label: "مدفوع مسبقاً" },
  loyalty_reward: { value: "loyalty_reward", label: "مكافأة ولاء" },
  /** @deprecated use loyalty_reward */
  points: { value: "loyalty_reward", label: "مكافأة ولاء" },
};

/** خيارات نوع الدفع عند حجز موعد من الاستقبال */
export const BOOKING_PAYMENT_OPTIONS = [
  PAYMENT_TYPES.cash,
  PAYMENT_TYPES.paid,
  PAYMENT_TYPES.loyalty_reward,
];

export const BOOKING_SOURCES = {
  manual: { value: "manual", label: "حجز يدوي", prefix: "BK" },
  app: { value: "app", label: "تطبيق الزبون", prefix: "APP" },
};

export function parseSlotStartMs(date, hour) {
  if (!date || !hour) return null;
  const [y, m, d] = date.split("-").map(Number);
  const parts = String(hour).split(":");
  const hh = Number(parts[0]);
  const mm = Number(parts[1] ?? 0);
  if (!y || !m || !d || !Number.isFinite(hh)) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RECEPTION_CALENDAR_EVENT));
}

function todayIso() {
  return localTodayIso();
}

function normalizeSlot(row) {
  return {
    ...row,
    deviceId: row.deviceId == null ? null : String(row.deviceId),
    status: normalizeSlotStatus(row.status),
    visitorName: row.visitorName || "",
    phone: row.phone || "",
    email: row.email || "",
    notes: row.notes || "",
    packageId: row.packageId ?? null,
    packageName: row.packageName || "—",
    packagePrice: row.packagePrice || "—",
    hourTo: row.hourTo || row.hour || "—",
    bookingCode: row.bookingCode || row.visitorNumber || "",
    bookingType:
      row.bookingType ||
      (row.source === "app" ? BOOKING_SOURCES.app.label : BOOKING_SOURCES.manual.label),
    paymentType:
      row.paymentType === "on_arrival"
        ? PAYMENT_TYPES.cash.value
        : row.paymentType || (row.isPaid ? PAYMENT_TYPES.paid.value : PAYMENT_TYPES.cash.value),
    attendanceStatus: row.attendanceStatus || ATTENDANCE_STATUS.awaiting,
    sessionStatus: row.sessionStatus || null,
    startedAt: row.startedAt || null,
    endedAt: row.endedAt || null,
    sessionDurationSeconds: row.sessionDurationSeconds ?? null,
    isPaid: Boolean(row.isPaid) || row.paymentType === PAYMENT_TYPES.points.value,
    source: row.source || "manual",
    receiptPdfUrl: row.receiptPdfUrl || null,
  };
}

export function calcHourTo(hourFrom, durationHours = 1) {
  const h = Number.parseInt(String(hourFrom).split(":")[0], 10);
  const dur = Number(durationHours) || 1;
  if (!Number.isFinite(h)) return hourFrom;
  const end = (h + dur) % 24;
  return `${String(end).padStart(2, "0")}:00`;
}

export function getDevicePackageInfo(device) {
  if (!device?.packageId) {
    return { packageId: null, packageName: "—", packagePrice: "—", hours: 1 };
  }
  const pkg = loadPackages().find((p) => p.id === device.packageId);
  if (!pkg) {
    return { packageId: device.packageId, packageName: "—", packagePrice: "—", hours: 1 };
  }
  const hours = Number(pkg.minimumHours ?? pkg.minimum_hours ?? 1) || 1;
  return {
    packageId: pkg.id,
    packageName: pkg.name,
    packagePrice: pkg.price,
    hours,
  };
}

function nextBookingCode(slots, source = "manual") {
  const meta = source === "app" ? BOOKING_SOURCES.app : BOOKING_SOURCES.manual;
  const prefix = meta.prefix;
  const max = slots.reduce((m, s) => {
    const code = String(s.bookingCode || "");
    if (!code.startsWith(`${prefix}-`)) return m;
    const n = Number.parseInt(code.split("-")[1], 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function persistCalendarSlots(slots) {
  try {
    const encoded = JSON.stringify(slots.map(normalizeSlot));
    const prev = localStorage.getItem(storageKey());
    if (prev === encoded) return;
    localStorage.setItem(storageKey(), encoded);
    notifyUpdated();
  } catch {
    /* ignore */
  }
}

export function loadCalendarSlots() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeSlot) : [];
  } catch {
    return [];
  }
}

export function generateBookingCode(source = "manual", slots = loadCalendarSlots()) {
  return nextBookingCode(slots, source);
}

/** @deprecated استخدم generateBookingCode */
export function generateVisitorNumber(slots = loadCalendarSlots()) {
  return generateBookingCode("manual", slots);
}

export function saveCalendarSlots(slots) {
  persistCalendarSlots(slots.map(normalizeSlot));
}

function slotKey(slot) {
  return `${slot.deviceId}|${slot.date}|${slot.hour}`;
}

export function mergeCalendarSlotsForDate(date, newSlots) {
  const others = loadCalendarSlots().filter((s) => s.date !== date);
  saveCalendarSlots([...others, ...newSlots.map(normalizeSlot)]);
}

export function mergeActiveCalendarSlots(newSlots) {
  const incoming = newSlots.map(normalizeSlot);
  const incomingKeys = new Set(incoming.map(slotKey));
  const incomingIds = new Set(incoming.map((s) => s.id));

  const kept = loadCalendarSlots().filter((slot) => {
    if (incomingIds.has(slot.id)) return false;
    if (incomingKeys.has(slotKey(slot))) return false;
    return true;
  });

  saveCalendarSlots([...kept, ...incoming]);
}

export async function syncCalendarFromApi(date) {
  const session = getActiveStaffSession();
  if (!isApiStaffSession(session)) return { ok: false, skipped: true };

  const result = await fetchReceptionCalendarByDate(date);
  if (!result.ok) return result;
  mergeCalendarSlotsForDate(date, result.slots);
  return { ok: true };
}

export async function syncActiveCalendarFromApi() {
  const session = getActiveStaffSession();
  if (!isApiStaffSession(session)) return { ok: false, skipped: true };

  const result = await fetchActiveReceptionCalendar();
  if (!result.ok) return result;
  mergeActiveCalendarSlots(result.slots);
  return { ok: true };
}

/** Polls date + active calendar APIs and notifies all reception listeners. */
export async function syncReceptionLiveState(selectedDate = todayIso()) {
  const session = getActiveStaffSession();
  if (!isApiStaffSession(session)) return { ok: false, skipped: true };

  const [dateResult, activeResult] = await Promise.all([
    fetchReceptionCalendarByDate(selectedDate),
    fetchActiveReceptionCalendar(),
  ]);

  if (dateResult.ok) {
    mergeCalendarSlotsForDate(selectedDate, dateResult.slots);
  }
  if (activeResult.ok) {
    mergeActiveCalendarSlots(activeResult.slots);
  }

  if (dateResult.ok || activeResult.ok) {
    notifyUpdated();
  }

  return { ok: dateResult.ok || activeResult.ok };
}

export async function markNoShowCalendarBooking(slotId) {
  const session = getActiveStaffSession();
  if (!isApiStaffSession(session)) {
    return { ok: false, error: "تسجيل عدم الحضور يتطلب اتصالاً بالخادم." };
  }

  const slots = loadCalendarSlots();
  const slot = findSlotById(slotId, slots);
  const apiRes = await apiMarkNoShowCalendarBooking(slotId);
  if (!apiRes.ok) return apiRes;

  invalidateFinanceCache();
  if (slot?.date) {
    await syncCalendarFromApi(slot.date);
  }
  await syncActiveCalendarFromApi();
  return { ok: true, ...apiRes };
}

export async function cancelCalendarBooking(slotId) {
  const session = getActiveStaffSession();
  if (isApiStaffSession(session)) {
    const apiRes = await apiCancelCalendarBooking(slotId);
    if (!apiRes.ok) return apiRes;
    await syncActiveCalendarFromApi();
    return { ok: true };
  }

  return cancelCalendarBookingLocal(slotId);
}

function cancelCalendarBookingLocal(slotId) {
  const slots = loadCalendarSlots();
  if (!findSlotById(slotId, slots)) {
    return { ok: false, error: "الحجز غير موجود." };
  }
  saveCalendarSlots(slots.filter((s) => s.id !== slotId));
  return { ok: true };
}

export function findCalendarSlot(deviceId, date, hour, slots = loadCalendarSlots()) {
  const id = String(deviceId);
  return slots.find((s) => String(s.deviceId) === id && s.date === date && s.hour === hour) ?? null;
}

export function findSlotById(id, slots = loadCalendarSlots()) {
  return slots.find((s) => s.id === id) ?? null;
}

export function paymentTypeLabel(value) {
  if (value === "online_pending") return "إلكتروني (قيد الدفع)";
  if (value === "online") return "إلكتروني";
  if (value === "loyalty_reward" || value === "points") return PAYMENT_TYPES.loyalty_reward.label;
  return Object.values(PAYMENT_TYPES).find((p) => p.value === value)?.label ?? value ?? "—";
}

export async function bookCalendarSlot({
  deviceId,
  date,
  hour,
  hourTo,
  visitorName = "",
  phone = "",
  email = "",
  notes = "",
  packageId = null,
  packageName = "—",
  packagePrice = "—",
  paymentType = PAYMENT_TYPES.cash.value,
  isPaid = false,
  source = "manual",
  bookingCode,
}) {
  if (isBookingsStopped()) {
    return { ok: false, error: getBookingsStopBlockMessage() };
  }

  const session = getActiveStaffSession();
  if (isApiStaffSession(session)) {
    const slots = loadCalendarSlots();
    const code = bookingCode || nextBookingCode(slots, source);

    const apiRes = await apiBookCalendarSlot({
      deviceId,
      date,
      hour,
      hourTo,
      visitorName,
      phone,
      email,
      notes,
      packageId,
      packageName,
      packagePrice,
      paymentType,
      isPaid,
      source,
      bookingCode: code,
    });

    if (!apiRes.ok) return apiRes;
    await syncCalendarFromApi(date);
    await syncActiveCalendarFromApi();
    return { ok: true, slot: apiRes.slot };
  }

  return bookCalendarSlotLocal({
    deviceId,
    date,
    hour,
    hourTo,
    visitorName,
    phone,
    email,
    notes,
    packageId,
    packageName,
    packagePrice,
    paymentType,
    isPaid,
    source,
    bookingCode,
  });
}

function bookCalendarSlotLocal({
  deviceId,
  date,
  hour,
  hourTo,
  visitorName = "",
  phone = "",
  email = "",
  notes = "",
  packageId = null,
  packageName = "—",
  packagePrice = "—",
  paymentType = PAYMENT_TYPES.cash.value,
  isPaid = false,
  source = "manual",
  bookingCode,
}) {
  const slots = loadCalendarSlots();
  const existing = findCalendarSlot(deviceId, date, hour, slots);
  if (existing) return { ok: false, error: "هذا الموعد محجوز مسبقاً." };

  const code = bookingCode || nextBookingCode(slots, source);
  const id = slots.reduce((max, s) => Math.max(max, s.id ?? 0), 0) + 1;

  if (paymentType === PAYMENT_TYPES.points.value) {
    const redeem = redeemPointsForBooking({
      phone: phone.trim(),
      name: visitorName.trim(),
      email: email.trim(),
      bookingCode: code,
    });
    if (!redeem.ok) return { ok: false, error: redeem.error };
  }

  const slot = normalizeSlot({
    id,
    deviceId,
    date,
    hour,
    hourTo: hourTo || hour,
    status: SLOT_STATUS.reserved,
    bookingCode: code,
    visitorNumber: code,
    visitorName: visitorName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    notes: notes.trim(),
    packageId,
    packageName,
    packagePrice,
    paymentType,
    isPaid: Boolean(isPaid) || paymentType === PAYMENT_TYPES.paid.value || paymentType === PAYMENT_TYPES.points.value,
    source,
    bookingType: source === "app" ? BOOKING_SOURCES.app.label : BOOKING_SOURCES.manual.label,
    attendanceStatus: ATTENDANCE_STATUS.awaiting,
    createdAt: new Date().toISOString(),
  });

  saveCalendarSlots([...slots, slot]);
  return { ok: true, slot };
}

export async function checkInBooking(slotId) {
  const slots = loadCalendarSlots();
  const idx = slots.findIndex((s) => s.id === slotId);
  if (idx < 0) return { ok: false, error: "الحجز غير موجود." };

  const session = getActiveStaffSession();
  if (isApiStaffSession(session)) {
    const apiRes = await apiCheckInCalendarBooking(slotId);
    if (!apiRes.ok) return apiRes;
    invalidateFinanceCache();
    await syncCalendarFromApi(slots[idx]?.date ?? todayIso());
    await syncActiveCalendarFromApi();
    return { ok: true };
  }

  const next = slots.map((s, i) =>
    i === idx ? { ...s, attendanceStatus: ATTENDANCE_STATUS.checkedIn } : s,
  );
  saveCalendarSlots(next);
  return { ok: true, slot: next[idx] };
}

export function updateCalendarSlot(slotId, patch) {
  const slots = loadCalendarSlots();
  const idx = slots.findIndex((s) => s.id === slotId);
  if (idx < 0) return { ok: false, error: "الحجز غير موجود." };
  const next = slots.map((s, i) => (i === idx ? normalizeSlot({ ...s, ...patch }) : s));
  saveCalendarSlots(next);
  return { ok: true, slot: next[idx] };
}

export async function startCalendarSession(deviceId, date, hour) {
  const slots = loadCalendarSlots();
  const slot = slots.find((s) => s.deviceId === deviceId && s.date === date && s.hour === hour);
  if (!slot) return { ok: false, error: "لا يوجد حجز لهذا الموعد." };

  const session = getActiveStaffSession();
  if (isApiStaffSession(session)) {
    const apiRes = await apiStartCalendarSession(slot.id);
    if (!apiRes.ok) return apiRes;
    if (apiRes.slot?.startedAt) {
      updateCalendarSlot(slot.id, {
        status: SLOT_STATUS.busy,
        startedAt: apiRes.slot.startedAt,
        sessionStatus: "playing",
      });
    }
    await syncActiveCalendarFromApi();
    await syncCalendarFromApi(date);
    return { ok: true };
  }

  const idx = slots.findIndex((s) => s.deviceId === deviceId && s.date === date && s.hour === hour);
  const next = slots.map((s, i) =>
    i === idx
      ? {
          ...s,
          status: SLOT_STATUS.busy,
          attendanceStatus: ATTENDANCE_STATUS.checkedIn,
          startedAt: new Date().toISOString(),
        }
      : s,
  );
  saveCalendarSlots(next);
  return { ok: true };
}

export async function endCalendarSession(deviceId, date, hour) {
  const slots = loadCalendarSlots();
  const slot = slots.find((s) => s.deviceId === deviceId && s.date === date && s.hour === hour) ?? null;

  const session = getActiveStaffSession();
  if (isApiStaffSession(session) && slot?.id) {
    const apiRes = await apiEndCalendarSession(slot.id);
    if (!apiRes.ok) return { ok: false, error: apiRes.error };
    invalidateFinanceCache();
    await syncActiveCalendarFromApi();
    await syncCalendarFromApi(date);
    const pointsResult = apiRes.loyalty?.earned
      ? {
          ok: true,
          earned: apiRes.loyalty.earned,
          balance: apiRes.loyalty.balance_after,
        }
      : null;
    return { ok: true, pointsResult, slot };
  }

  let pointsResult = null;
  if (slot?.status === SLOT_STATUS.busy) {
    pointsResult = awardPointsForCompletedSession(slot);
  }
  const next = slots.filter((s) => !(s.deviceId === deviceId && s.date === date && s.hour === hour));
  saveCalendarSlots(next);
  return { ok: true, pointsResult, slot };
}

export function getAwaitingBookings(slots = loadCalendarSlots()) {
  return slots
    .filter(
      (s) =>
        s.status === SLOT_STATUS.reserved &&
        s.attendanceStatus === ATTENDANCE_STATUS.awaiting,
    )
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : a.hour.localeCompare(b.hour);
    });
}

export function getSessionBookings(slots = loadCalendarSlots()) {
  return slots
    .filter(
      (s) =>
        s.attendanceStatus === ATTENDANCE_STATUS.checkedIn &&
        (s.status === SLOT_STATUS.reserved || s.status === SLOT_STATUS.busy),
    )
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : a.hour.localeCompare(b.hour);
    });
}

export function getActiveCalendarSessions(slots = loadCalendarSlots()) {
  return slots.filter((s) => normalizeSlotStatus(s.status) === SLOT_STATUS.busy);
}

export function getTodayBookedSlots(slots = loadCalendarSlots()) {
  const today = todayIso();
  return slots
    .filter(
      (s) =>
        s.date === today &&
        (s.status === SLOT_STATUS.reserved || s.status === SLOT_STATUS.busy),
    )
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

export function getCalendarStatsForDate(date, devices, slots = loadCalendarSlots()) {
  const daySlots = slots.filter((s) => s.date === date);
  const maintenanceCount = devices.filter((d) => d._maintenance).length;
  return {
    reserved: daySlots.filter((s) => s.status === SLOT_STATUS.reserved).length,
    busy: daySlots.filter((s) => normalizeSlotStatus(s.status) === SLOT_STATUS.busy).length,
    totalDevices: devices.length,
    maintenance: maintenanceCount,
  };
}

export { todayIso };
