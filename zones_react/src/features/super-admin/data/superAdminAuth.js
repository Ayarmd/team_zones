import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_ROUTES } from "./superAdminConstants";

const SESSION_KEY = "zones-super-admin-session";
export const SUPER_ADMIN_PROFILE_EVENT = "zones-super-admin-profile-updated";

const DEFAULT_PROFILE = {
  id: 1,
  fullName: "جيجي أدمن",
  email: SUPER_ADMIN_EMAIL,
  phone: "+218 91 234 5678",
  residence: "طرابلس، ليبيا",
  username: "gigi_admin",
  joinDate: "2024-01-15",
  avatar: "https://randomuser.me/api/portraits/women/65.jpg",
};

export function authenticateSuperAdmin(email, password) {
  const normalized = String(email || "").trim().toLowerCase();
  if (normalized === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
    return { ...DEFAULT_PROFILE };
  }
  return null;
}

export function setSuperAdminSession(profile) {
  const session = { ...profile, loggedInAt: new Date().toISOString() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSuperAdminSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const next = { ...DEFAULT_PROFILE, ...parsed };
    if (!parsed.fullName || parsed.fullName === "الأدمن العام") next.fullName = DEFAULT_PROFILE.fullName;
    if (!parsed.avatar) next.avatar = DEFAULT_PROFILE.avatar;
    if (
      !parsed.email ||
      parsed.email === "admin@hall-platform.ly" ||
      parsed.email === "superadmin@system.com"
    )
      next.email = SUPER_ADMIN_EMAIL;
    return next;
  } catch {
    return null;
  }
}

export function clearSuperAdminSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateSuperAdminProfile(patch) {
  const current = getSuperAdminSession() || DEFAULT_PROFILE;
  const next = { ...current, ...patch };
  setSuperAdminSession(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SUPER_ADMIN_PROFILE_EVENT));
  }
  return next;
}

export function verifySuperAdminPassword(currentPassword) {
  return currentPassword === SUPER_ADMIN_PASSWORD;
}

export function changeSuperAdminPassword(currentPassword, newPassword) {
  if (!verifySuperAdminPassword(currentPassword)) {
    return { ok: false, error: "كلمة المرور الحالية غير صحيحة." };
  }
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل." };
  }
  return { ok: true };
}

export function getSuperAdminLoginRedirect() {
  return SUPER_ADMIN_ROUTES.dashboard;
}
