const HOUR_MS = 60 * 60 * 1000;

/** نهاية الجلسة = ساعة الحجز + ساعة واحدة */
export function getSlotSessionEndTime(dateIso, hourStr) {
  const [h, m = 0] = hourStr.split(":").map(Number);
  const end = new Date(`${dateIso}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  return new Date(end.getTime() + HOUR_MS);
}

export function getSessionRemainingMs(dateIso, hourStr, now = Date.now()) {
  const end = getSlotSessionEndTime(dateIso, hourStr);
  return Math.max(0, end.getTime() - now);
}

export function formatSessionRemaining(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
