const HOUR_MS = 60 * 60 * 1000;

function parseHourOnDate(dateIso, hourStr) {
  const [h, m = 0] = String(hourStr || "0:0").split(":").map(Number);
  return new Date(`${dateIso}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
}

/** نهاية الجلسة = ساعة «إلى» من الحجز، أو ساعة البداية + ساعة واحدة */
export function getSlotSessionEndTime(dateIso, hourStr, hourToStr) {
  if (hourToStr && hourToStr !== "—" && hourToStr !== hourStr) {
    return parseHourOnDate(dateIso, hourToStr);
  }
  const start = parseHourOnDate(dateIso, hourStr);
  return new Date(start.getTime() + HOUR_MS);
}

export function getSessionRemainingMs(dateIso, hourStr, hourToStr, now = Date.now()) {
  const end = getSlotSessionEndTime(dateIso, hourStr, hourToStr);
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
