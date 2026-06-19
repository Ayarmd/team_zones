import { normalizeGmailEmail } from "../../../shared/utils/normalizeGmailEmail";

const STORAGE_KEY = "zones-hall-manager-invites-v1";
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

function inviteEmail(email) {
  return normalizeGmailEmail(String(email || "").trim().toLowerCase());
}

function loadInvites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    let changed = false;
    const next = parsed.map((row) => {
      const email = inviteEmail(row.email);
      if (email !== row.email) changed = true;
      return { ...row, email };
    });
    if (changed) saveInvites(next);
    return next;
  } catch {
    return [];
  }
}

function saveInvites(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function generateToken() {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${time}${rand}`.slice(0, 16);
}

export function buildManagerRegistrationUrl(token) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/manager/complete-registration/${token}`;
}

export function createHallManagerInvite({
  requestId,
  hallId,
  email,
  managerName,
  hallName,
  commissionRate,
  subscriptionMonths,
  adminNotes,
}) {
  const token = generateToken();
  const invite = {
    token,
    requestId,
    hallId,
    email: inviteEmail(email),
    managerName,
    hallName,
    commissionRate: commissionRate ?? null,
    subscriptionMonths: subscriptionMonths ?? 12,
    adminNotes: adminNotes || "",
    createdAt: Date.now(),
    expiresAt: Date.now() + INVITE_TTL_MS,
    completed: false,
    completedAt: null,
  };
  const list = loadInvites().filter((i) => i.requestId !== requestId);
  saveInvites([invite, ...list]);
  return invite;
}

export function getInviteByToken(token) {
  if (!token) return null;
  const invite = loadInvites().find((i) => i.token === token) ?? null;
  if (!invite) return null;
  if (invite.completed) return { ...invite, expired: false, alreadyUsed: true };
  if (Date.now() > invite.expiresAt) return { ...invite, expired: true, alreadyUsed: false };
  return { ...invite, expired: false, alreadyUsed: false };
}

export function markInviteCompleted(token) {
  const list = loadInvites();
  const idx = list.findIndex((i) => i.token === token);
  if (idx < 0) return false;
  list[idx] = { ...list[idx], completed: true, completedAt: Date.now() };
  saveInvites(list);
  return true;
}

/** مزامنة نسبة العمولة مع الدعوات غير المكتملة عند تغيير الإعداد العام */
export function syncInvitesCommissionRate(rate) {
  const safeRate = Number(rate);
  if (Number.isNaN(safeRate)) return;
  const list = loadInvites();
  const next = list.map((invite) =>
    invite.completed ? invite : { ...invite, commissionRate: safeRate },
  );
  saveInvites(next);
}
