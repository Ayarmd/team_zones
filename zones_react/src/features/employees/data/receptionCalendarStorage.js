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

const STORAGE_KEY = "zones-reception-calendar-v1";

export const RECEPTION_CALENDAR_EVENT = "zones-reception-calendar-updated";

/** إلغاء تلقائي إذا لم يحضر الزبون قبل 30 دقيقة من بدء اللعب */
export const NO_SHOW_GRACE_MS = 30 * 60 * 1000;

export const SLOT_STATUS = {
  reserved: "reserved",
  active: "active",
};

export const ATTENDANCE_STATUS = {
  awaiting: "awaiting",
  checkedIn: "checked_in",
};

export const PAYMENT_TYPES = {
  cash: { value: "cash", label: "كاش" },
  paid: { value: "paid", label: "مدفوع مسبقاً" },
  points: { value: "points", label: "نقاط ولاء" },
};

/** خيارات نوع الدفع عند حجز موعد من الاستقبال */
export const BOOKING_PAYMENT_OPTIONS = [
  PAYMENT_TYPES.cash,
  PAYMENT_TYPES.paid,
  PAYMENT_TYPES.points,
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

function purgeNoShowBookings(slots) {
  const now = Date.now();
  return slots.filter((slot) => {
    if (
      slot.status !== SLOT_STATUS.reserved ||
      slot.attendanceStatus !== ATTENDANCE_STATUS.awaiting
    ) {
      return true;
    }
    const startMs = parseSlotStartMs(slot.date, slot.hour);
    if (startMs == null) return true;
    return now < startMs - NO_SHOW_GRACE_MS;
  });
}

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RECEPTION_CALENDAR_EVENT));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeSlot(row) {
  return {
    ...row,
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
    isPaid: Boolean(row.isPaid) || row.paymentType === PAYMENT_TYPES.points.value,
    source: row.source || "manual",
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
  const hours = Number.parseInt(String(pkg.hours).replace(/\D/g, ""), 10) || 1;
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

function buildSeedSlots() {
  const date = todayIso();
  const devices = loadDevices();
  const pkg1 = getDevicePackageInfo(devices.find((d) => d.id === 1));
  const pkg3 = getDevicePackageInfo(devices.find((d) => d.id === 2));

  return [
    {
      id: 1,
      deviceId: 1,
      date,
      hour: "15:00",
      hourTo: calcHourTo("15:00", pkg1.hours),
      status: SLOT_STATUS.reserved,
      bookingCode: "APP-001",
      visitorNumber: "APP-001",
      visitorName: "محمد الزليطني",
      phone: "0912345678",
      email: "",
      notes: "حجز من التطبيق",
      packageId: pkg1.packageId,
      packageName: pkg1.packageName,
      packagePrice: pkg1.packagePrice,
      paymentType: PAYMENT_TYPES.paid.value,
      isPaid: true,
      source: "app",
      bookingType: BOOKING_SOURCES.app.label,
      attendanceStatus: ATTENDANCE_STATUS.awaiting,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      deviceId: 1,
      date,
      hour: "14:00",
      hourTo: calcHourTo("14:00", pkg1.hours),
      status: SLOT_STATUS.active,
      bookingCode: "BK-001",
      visitorNumber: "BK-001",
      visitorName: "أحمد الفيتوري",
      phone: "0923456789",
      email: "",
      notes: "",
      packageId: pkg1.packageId,
      packageName: pkg1.packageName,
      packagePrice: pkg1.packagePrice,
      paymentType: PAYMENT_TYPES.cash.value,
      isPaid: true,
      source: "manual",
      bookingType: BOOKING_SOURCES.manual.label,
      attendanceStatus: ATTENDANCE_STATUS.checkedIn,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      deviceId: 2,
      date,
      hour: "18:00",
      hourTo: calcHourTo("18:00", pkg3.hours),
      status: SLOT_STATUS.reserved,
      bookingCode: "APP-002",
      visitorNumber: "APP-002",
      visitorName: "سالم بوعزيزة",
      phone: "0934567890",
      email: "",
      notes: "يريد جهاز مع يد إضافية",
      packageId: pkg3.packageId,
      packageName: pkg3.packageName,
      packagePrice: pkg3.packagePrice,
      paymentType: PAYMENT_TYPES.cash.value,
      isPaid: false,
      source: "app",
      bookingType: BOOKING_SOURCES.app.label,
      attendanceStatus: ATTENDANCE_STATUS.awaiting,
      createdAt: new Date().toISOString(),
    },
  ];
}

function persistCalendarSlots(slots) {
  try {
    const encoded = JSON.stringify(slots.map(normalizeSlot));
    const prev = localStorage.getItem(STORAGE_KEY);
    if (prev === encoded) return;
    localStorage.setItem(STORAGE_KEY, encoded);
    notifyUpdated();
  } catch {
    /* ignore */
  }
}

export function loadCalendarSlots() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let slots;
    if (!raw) {
      slots = buildSeedSlots().map(normalizeSlot);
    } else {
      const parsed = JSON.parse(raw);
      slots = Array.isArray(parsed) ? parsed.map(normalizeSlot) : buildSeedSlots().map(normalizeSlot);
    }
    const purged = purgeNoShowBookings(slots);
    if (purged.length !== slots.length) {
      persistCalendarSlots(purged);
    }
    return purged;
  } catch {
    return buildSeedSlots().map(normalizeSlot);
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

export function cancelCalendarBooking(slotId) {
  const slots = loadCalendarSlots();
  if (!findSlotById(slotId, slots)) {
    return { ok: false, error: "الحجز غير موجود." };
  }
  saveCalendarSlots(slots.filter((s) => s.id !== slotId));
  return { ok: true };
}

export function findCalendarSlot(deviceId, date, hour, slots = loadCalendarSlots()) {
  return slots.find((s) => s.deviceId === deviceId && s.date === date && s.hour === hour) ?? null;
}

export function findSlotById(id, slots = loadCalendarSlots()) {
  return slots.find((s) => s.id === id) ?? null;
}

export function paymentTypeLabel(value) {
  return Object.values(PAYMENT_TYPES).find((p) => p.value === value)?.label ?? value ?? "—";
}

export function bookCalendarSlot({
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

export function checkInBooking(slotId) {
  const slots = loadCalendarSlots();
  const idx = slots.findIndex((s) => s.id === slotId);
  if (idx < 0) return { ok: false, error: "الحجز غير موجود." };
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

export function startCalendarSession(deviceId, date, hour) {
  const slots = loadCalendarSlots();
  const idx = slots.findIndex((s) => s.deviceId === deviceId && s.date === date && s.hour === hour);
  if (idx < 0) return { ok: false, error: "لا يوجد حجز لهذا الموعد." };

  const next = slots.map((s, i) =>
    i === idx
      ? {
          ...s,
          status: SLOT_STATUS.active,
          attendanceStatus: ATTENDANCE_STATUS.checkedIn,
          startedAt: new Date().toISOString(),
        }
      : s,
  );
  saveCalendarSlots(next);
  return { ok: true };
}

export function endCalendarSession(deviceId, date, hour) {
  const slots = loadCalendarSlots();
  const slot = slots.find((s) => s.deviceId === deviceId && s.date === date && s.hour === hour) ?? null;
  const pointsResult =
    slot?.status === SLOT_STATUS.active ? awardPointsForCompletedSession(slot) : null;
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
        (s.status === SLOT_STATUS.reserved || s.status === SLOT_STATUS.active),
    )
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : a.hour.localeCompare(b.hour);
    });
}

export function getActiveCalendarSessions(slots = loadCalendarSlots()) {
  return slots.filter((s) => s.status === SLOT_STATUS.active);
}

export function getTodayBookedSlots(slots = loadCalendarSlots()) {
  const today = todayIso();
  return slots
    .filter(
      (s) =>
        s.date === today &&
        (s.status === SLOT_STATUS.reserved || s.status === SLOT_STATUS.active),
    )
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

export function getCalendarStatsForDate(date, devices, slots = loadCalendarSlots()) {
  const daySlots = slots.filter((s) => s.date === date);
  const maintenanceCount = devices.filter((d) => d._maintenance).length;
  return {
    reserved: daySlots.filter((s) => s.status === SLOT_STATUS.reserved).length,
    active: daySlots.filter((s) => s.status === SLOT_STATUS.active).length,
    totalDevices: devices.length,
    maintenance: maintenanceCount,
  };
}

export { todayIso };
