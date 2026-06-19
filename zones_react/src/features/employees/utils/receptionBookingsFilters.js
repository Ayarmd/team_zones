import { todayIso } from "../data/receptionCalendarStorage";

const WEEKDAY_SHORT = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** أيام الأسبوع الحالي (من الأحد إلى السبت) */
export function getCurrentWeekDays(reference = new Date()) {
  const ref = new Date(reference);
  ref.setHours(12, 0, 0, 0);
  const weekStart = new Date(ref);
  weekStart.setDate(ref.getDate() - ref.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const iso = toIso(d);
    return {
      iso,
      weekdayShort: WEEKDAY_SHORT[i],
      weekdayLong: d.toLocaleDateString("ar-LY", { weekday: "long" }),
      dayNum: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      isToday: iso === todayIso(),
    };
  });
}

export function getCurrentMonthLabel(reference = new Date()) {
  return reference.toLocaleDateString("ar-LY", { month: "long", year: "numeric" });
}

export function bookingInCurrentMonth(booking, reference = new Date()) {
  if (!booking?.date) return false;
  const [y, m] = booking.date.split("-").map(Number);
  return y === reference.getFullYear() && m === reference.getMonth() + 1;
}

export function isAppBooking(booking) {
  return booking.source === "app" || String(booking.bookingCode || "").startsWith("APP-");
}

export function isManualBooking(booking) {
  return !isAppBooking(booking);
}

export const BOOKING_SOURCE_FILTERS = [
  { value: "all", label: "الكل" },
  { value: "app", label: "تطبيق" },
  { value: "manual", label: "يدوي" },
];
