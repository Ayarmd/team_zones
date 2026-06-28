import { apiClient, mapApiErrorMessage } from "../../../shared/api/apiClient";

export const CUSTOMER_BAN_EVENT = "zones-customer-ban-updated";

export const NO_SHOW_BAN_THRESHOLD = 3;
export const BAN_DURATION_DAYS = 3;

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CUSTOMER_BAN_EVENT));
}

function mapBanRow(row) {
  return {
    id: row.id,
    phone: row.phone || row.phone_key || "",
    phoneKey: row.phone_key || row.phone || "",
    name: row.name || "",
    noShowCount: row.no_show_count ?? 0,
    bannedAt: row.banned_at || null,
    bannedUntil: row.banned_until || null,
    active: Boolean(row.active),
    isActive: Boolean(row.is_active),
    liftedAt: row.lifted_at || null,
    reason: row.reason || "",
  };
}

export async function fetchReceptionBans() {
  try {
    const { data } = await apiClient.get("/staff/reception/bans");
    const history = (data.history || []).map(mapBanRow);
    const activeBans = (data.active_bans || history.filter((b) => b.isActive)).map(mapBanRow);
    return {
      ok: true,
      activeBans,
      history,
      banThreshold: data.ban_threshold ?? NO_SHOW_BAN_THRESHOLD,
      banDurationDays: data.ban_duration_days ?? BAN_DURATION_DAYS,
    };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), activeBans: [], history: [] };
  }
}

export async function liftReceptionBan(banId, note = "") {
  try {
    const { data } = await apiClient.post(`/staff/reception/bans/${banId}/lift`, {
      note: note || undefined,
    });
    notifyUpdated();
    return { ok: true, ban: mapBanRow(data.ban || {}), message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function fetchReceptionNoShows(limit = 50) {
  try {
    const { data } = await apiClient.get("/staff/reception/no-shows", { params: { limit } });
    return { ok: true, noShows: data.no_shows || [] };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), noShows: [] };
  }
}

export function formatBanRemaining(untilIso, now = Date.now()) {
  const ms = new Date(untilIso).getTime() - now;
  if (ms <= 0) return "منتهٍ";
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours >= 24) return `${Math.ceil(hours / 24)} يوم`;
  return `${hours} ساعة`;
}
