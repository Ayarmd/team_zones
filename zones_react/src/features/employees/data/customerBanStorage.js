import { normalizePhone } from "../../loyalty/data/loyaltyPointsStorage";

const NO_SHOW_COUNTS_KEY = "zones-customer-no-show-counts-v1";
const NO_SHOW_ARCHIVE_KEY = "zones-no-show-bookings-v1";
const BANS_KEY = "zones-customer-bans-v1";

export const CUSTOMER_BAN_EVENT = "zones-customer-ban-updated";

export const NO_SHOW_BAN_THRESHOLD = 3;
export const BAN_DURATION_DAYS = 3;
export const BAN_DURATION_MS = BAN_DURATION_DAYS * 24 * 60 * 60 * 1000;

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CUSTOMER_BAN_EVENT));
}

function loadNoShowCounts() {
  try {
    const raw = localStorage.getItem(NO_SHOW_COUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveNoShowCounts(counts) {
  localStorage.setItem(NO_SHOW_COUNTS_KEY, JSON.stringify(counts));
}

function loadNoShowArchiveRaw() {
  try {
    const raw = localStorage.getItem(NO_SHOW_ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNoShowArchive(rows) {
  localStorage.setItem(NO_SHOW_ARCHIVE_KEY, JSON.stringify(rows.slice(0, 200)));
}

function buildSeedBans() {
  const now = new Date();
  return [
    {
      id: 1,
      phoneKey: normalizePhone("0934567890"),
      phone: "0934567890",
      name: "سالم بوعزيزة",
      email: "",
      noShowCount: NO_SHOW_BAN_THRESHOLD,
      bannedAt: now.toISOString(),
      bannedUntil: new Date(now.getTime() + BAN_DURATION_MS).toISOString(),
      active: true,
      reason: `${NO_SHOW_BAN_THRESHOLD}_no_shows`,
    },
  ];
}

function loadBansRaw() {
  try {
    const raw = localStorage.getItem(BANS_KEY);
    if (!raw) {
      const seed = buildSeedBans();
      saveBans(seed);
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : buildSeedBans();
  } catch {
    return buildSeedBans();
  }
}

function saveBans(rows) {
  localStorage.setItem(BANS_KEY, JSON.stringify(rows));
  notifyUpdated();
}

function phoneKey(phone) {
  return normalizePhone(phone);
}

export function getCustomerNoShowCount(phone) {
  const key = phoneKey(phone);
  if (!key) return 0;
  return Number(loadNoShowCounts()[key] || 0);
}

export function isAppCustomerBanned(phone, now = Date.now()) {
  const key = phoneKey(phone);
  if (!key) return false;
  return loadBansRaw().some(
    (ban) =>
      ban.phoneKey === key &&
      ban.active &&
      !ban.liftedAt &&
      new Date(ban.bannedUntil).getTime() > now,
  );
}

export function getAppCustomerBanBlockMessage(phone) {
  const ban = getActiveBanForPhone(phone);
  if (!ban) return "حسابك محظور مؤقتاً من الحجز عبر التطبيق.";
  const until = new Date(ban.bannedUntil).toLocaleString("ar-LY");
  return `حسابك محظور من الحجز عبر التطبيق حتى ${until} بسبب تكرار عدم الحضور.`;
}

export function getActiveBanForPhone(phone, now = Date.now()) {
  const key = phoneKey(phone);
  if (!key) return null;
  return (
    loadBansRaw().find(
      (ban) =>
        ban.phoneKey === key &&
        ban.active &&
        !ban.liftedAt &&
        new Date(ban.bannedUntil).getTime() > now,
    ) ?? null
  );
}

export function loadBanRecords(now = Date.now()) {
  return loadBansRaw()
    .map((ban) => ({
      ...ban,
      isActive: Boolean(ban.active) && !ban.liftedAt && new Date(ban.bannedUntil).getTime() > now,
    }))
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return String(b.bannedAt).localeCompare(String(a.bannedAt));
    });
}

export function loadActiveBanRecords(now = Date.now()) {
  return loadBanRecords(now).filter((b) => b.isActive);
}

export function loadNoShowArchive(limit = 50) {
  return loadNoShowArchiveRaw()
    .sort((a, b) => String(b.noShowAt).localeCompare(String(a.noShowAt)))
    .slice(0, limit);
}

/** تسجيل no-show من حجز منتهٍ — يحرر الموعد ويحدّث العداد والحظر */
export function registerNoShowFromSlot(slot) {
  if (!slot?.phone?.trim()) {
    return { ok: false, reason: "no_phone" };
  }

  const key = phoneKey(slot.phone);
  const now = new Date();
  const nowIso = now.toISOString();

  const archive = loadNoShowArchiveRaw();
  const archiveId = archive.reduce((max, row) => Math.max(max, row.id ?? 0), 0) + 1;
  archive.unshift({
    id: archiveId,
    ...slot,
    status: "no_show",
    attendanceStatus: "no_show",
    noShowAt: nowIso,
  });
  saveNoShowArchive(archive);

  const counts = loadNoShowCounts();
  const nextCount = (counts[key] || 0) + 1;
  counts[key] = nextCount;
  saveNoShowCounts(counts);

  let banCreated = null;
  if (nextCount >= NO_SHOW_BAN_THRESHOLD) {
    const bans = loadBansRaw();
    const banId = bans.reduce((max, row) => Math.max(max, row.id ?? 0), 0) + 1;
    const bannedUntil = new Date(now.getTime() + BAN_DURATION_MS).toISOString();
    banCreated = {
      id: banId,
      phoneKey: key,
      phone: slot.phone.trim(),
      name: slot.visitorName?.trim() || "",
      email: slot.email?.trim() || "",
      noShowCount: nextCount,
      bannedAt: nowIso,
      bannedUntil,
      active: true,
      reason: `${NO_SHOW_BAN_THRESHOLD}_no_shows`,
    };
    saveBans([banCreated, ...bans]);
    counts[key] = 0;
    saveNoShowCounts(counts);
  }

  notifyUpdated();
  return { ok: true, noShowCount: nextCount, banCreated };
}

export function liftBanManually(banId) {
  const bans = loadBansRaw();
  const idx = bans.findIndex((b) => b.id === banId);
  if (idx < 0) return { ok: false, error: "سجل الحظر غير موجود." };

  const ban = bans[idx];
  const now = Date.now();
  const stillActive = ban.active && new Date(ban.bannedUntil).getTime() > now;
  if (!stillActive) return { ok: false, error: "الحظر منتهٍ أو مُرفوع مسبقاً." };

  const nowIso = new Date().toISOString();
  bans[idx] = {
    ...ban,
    active: false,
    liftedAt: nowIso,
    liftedBy: "reception_manual",
    liftNote: "فك حظر يدوي من موظف الاستقبال",
  };
  saveBans(bans);
  return { ok: true, ban: bans[idx] };
}

export function formatBanRemaining(untilIso, now = Date.now()) {
  const ms = new Date(untilIso).getTime() - now;
  if (ms <= 0) return "منتهٍ";
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours >= 24) return `${Math.ceil(hours / 24)} يوم`;
  return `${hours} ساعة`;
}
