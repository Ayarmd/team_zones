import { loadManagerHall } from "../../lounge/data/managerHallStorage";

export const BOOKINGS_STOP_NAME = "إيقاف حجوزات";

export const BOOKINGS_STOP_REASONS = [
  { value: "صيانة طارئة", label: "صيانة طارئة" },
  { value: "تحديث نظام", label: "تحديث نظام" },
  { value: "إجازة رسمية", label: "إجازة رسمية" },
];

export const BOOKINGS_STOP_ACTION = {
  value: "stop_bookings",
  label: BOOKINGS_STOP_NAME,
};

export function getHallDisplayName() {
  const hall = loadManagerHall();
  return hall?.hallName?.trim() || "ZONES Gaming Center";
}

export function buildBookingsStopNotificationText(hallName = getHallDisplayName()) {
  return `تم إيقاف حجوزات في صالة ${hallName}. دمتم سالمين.`;
}

export function buildBookingsStartNotificationText(hallName = getHallDisplayName()) {
  return `الحجز في الصالة ${hallName} متاح الآن، يمكنك الحجز.`;
}
