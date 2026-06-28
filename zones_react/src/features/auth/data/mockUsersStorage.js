import { normalizeRole } from "../../employees/data/employeeMeta";
import { loadEmployees, saveEmployees } from "../../employees/data/employeesStorage";
import { normalizeGmailEmail } from "../../../shared/utils/normalizeGmailEmail";
import { getActiveHallId } from "../../../shared/tenant/hallScopedStorage";
import { EMPLOYEE_LOGIN_PATH, MANAGER_LOGIN_PATH } from "./authRoutes";
import {
  buildManagerWorkspacePath,
  buildMaintenanceWorkspacePath,
  buildReceptionWorkspacePath,
  clearScopedAccount,
  findScopedManagerSession,
  getActiveAccountIdFromUrl,
  getScopedToken,
  migrateLegacySessionToScoped,
  readLegacySession,
  readScopedSession,
  setScopedToken,
  writeScopedSession,
} from "./accountSessionStorage";

const USERS_KEY = "zones-mock-users-v2";
const SESSION_KEY = "zones-auth-session";
const MANAGER_TOKEN_KEY = "zones-manager-token";
const LEGACY_SESSION_KEY = "zones-auth-session"; // كان في sessionStorage
export const PROFILE_UPDATED_EVENT = "zones-profile-updated";
export const AUTH_SESSION_EVENT = "zones-auth-session-updated";

/** أدوار قديمة في الجلسة أو المستخدمين */
const LEGACY_MANAGER_ROLES = new Set(["admin", "supervisor"]);
const LEGACY_MAINTENANCE_ROLES = new Set(["technician"]);

function authEmail(email) {
  return normalizeGmailEmail(String(email || "").trim().toLowerCase());
}

const DEFAULT_MANAGER_AVATAR =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face";

const DEFAULT_USERS = [];

function normalizeUser(row) {
  return {
    ...row,
    email: normalizeGmailEmail(row.email),
    phone: row.phone || "",
    avatar: row.avatar || "",
    residence: row.residence || "",
    username: row.username || "",
    gender: row.gender || "",
    birthDate: row.birthDate || "",
    jobTitle: row.jobTitle || "مدير صالة",
    joinDate: row.joinDate || new Date().toISOString().slice(0, 10),
    active: row.active !== false,
  };
}

export function loadMockUsers() {
  const stored = loadUsersRaw();
  if (!stored?.length) return [];
  return stored.map(normalizeUser);
}

function loadUsersRaw() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    let emailChanged = false;
    const next = parsed.map((row) => {
      const normalized = normalizeUser(row);
      if (normalizeGmailEmail(row.email) !== row.email) emailChanged = true;
      return normalized;
    });
    if (emailChanged) saveMockUsers(next);
    return next;
  } catch {
    return null;
  }
}

/** يضمن وجود حسابات المدير الافتراضية دون استبدال أي حساب موجود */
function ensureDefaultUsers(list) {
  const result = [...list];
  let changed = false;
  for (const def of DEFAULT_USERS) {
    const exists = result.some((u) => u.email === def.email);
    if (!exists) {
      result.push(normalizeUser(def));
      changed = true;
    }
  }
  return { users: result, changed };
}

function ensureDefaultProfilePhotos(list) {
  let changed = false;
  const BAD_AVATARS = new Set(["https://randomuser.me/api/portraits/women/65.jpg"]);
  const next = list.map((row) => {
    const def = DEFAULT_USERS.find((u) => u.email === row.email);
    if (!def) return row;
    const patch = {};
    if (def.employeeId != null && row.employeeId !== def.employeeId) {
      patch.employeeId = def.employeeId;
    }
    if (def.avatar && (!row.avatar?.trim() || BAD_AVATARS.has(row.avatar))) {
      patch.avatar = def.avatar;
    }
    if (Object.keys(patch).length === 0) return row;
    changed = true;
    return normalizeUser({ ...row, ...patch });
  });
  return { users: next, changed };
}

const DEMO_ACCOUNTS_REPAIR_KEY = "zones-demo-accounts-isolated-v1";

/** يصلّح حسابات العرض إذا اختلطت الأسماء — مرة واحدة فقط */
function repairDemoAccountNamesOnce(list) {
  if (typeof window === "undefined") return { users: list, changed: false };
  if (localStorage.getItem(DEMO_ACCOUNTS_REPAIR_KEY)) return { users: list, changed: false };

  let changed = false;
  const next = list.map((row) => {
    const def = DEFAULT_USERS.find((u) => u.email === row.email);
    if (!def) return row;
    if (row.fullName === def.fullName && row.id == def.id && row.employeeId == def.employeeId) {
      return row;
    }
    changed = true;
    return normalizeUser({
      ...row,
      id: def.id,
      role: def.role,
      fullName: def.fullName,
      employeeId: def.employeeId ?? null,
    });
  });

  localStorage.setItem(DEMO_ACCOUNTS_REPAIR_KEY, "1");
  return { users: next, changed };
}

function ensureDemoAccountIdentity(list) {
  let changed = false;
  const next = list.map((row) => {
    const def = DEFAULT_USERS.find((u) => u.email === row.email);
    if (!def) return row;
    const patch = {};
    if (row.id != def.id) patch.id = def.id;
    if (def.employeeId != null && row.employeeId != def.employeeId) patch.employeeId = def.employeeId;
    if (Object.keys(patch).length === 0) return row;
    changed = true;
    return normalizeUser({ ...row, ...patch });
  });
  return { users: next, changed };
}

export function saveMockUsers(list) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(list.map(normalizeUser)));
  } catch {
    /* ignore */
  }
}

export function nextUserId(list) {
  return list.reduce((max, u) => Math.max(max, u.id ?? 0), 0) + 1;
}

export function findUserByEmail(email) {
  const normalized = authEmail(email);
  if (!normalized) return null;
  return loadMockUsers().find((u) => u.email === normalized) ?? null;
}

export function getUserById(id) {
  if (id == null) return null;
  return loadMockUsers().find((u) => u.id == id) ?? null;
}

export function authenticateUser(email, password) {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) return null;
  if (user.active === false) return null;
  return user;
}

/** مزامنة حالة التفعيل مع لوحة الأدمن */
export function setMockUsersActiveByEmails(emails, active) {
  const targets = new Set(
    (emails || []).map((e) => authEmail(e)).filter(Boolean),
  );
  if (!targets.size) return;

  const list = loadMockUsers();
  let changed = false;
  const next = list.map((row) => {
    if (!targets.has(row.email.toLowerCase())) return row;
    if (row.active === active) return row;
    changed = true;
    return { ...row, active };
  });
  if (changed) saveMockUsers(next);

  if (!active) clearAuthSessionForEmails([...targets]);
}

export function clearAuthSessionForEmails(emails) {
  const targets = new Set(
    (emails || []).map((e) => authEmail(e)).filter(Boolean),
  );
  if (!targets.size) return;

  try {
    const raw = readSessionRaw();
    if (!raw) return;
    const session = JSON.parse(raw);
    if (session?.email && targets.has(authEmail(session.email))) {
      clearAuthSession();
    }
  } catch {
    /* ignore */
  }
}

export function registerManagerUser({ email, password, fullName, phone, hallId = null }) {
  const list = loadMockUsers();
  const normalized = authEmail(email);
  if (!normalized) return { ok: false, error: "البريد غير صالح." };
  if (list.some((u) => u.email === normalized)) {
    return { ok: false, error: "البريد مسجّل مسبقاً." };
  }
  const user = normalizeUser({
    id: nextUserId(list),
    email: normalized,
    password,
    role: "manager",
    fullName: fullName.trim(),
    employeeId: null,
    phone: String(phone || "").trim(),
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    hallId: hallId ?? null,
  });
  saveMockUsers([...list, user]);
  return { ok: true, user };
}

export function registerEmployeeUser({ email, password, fullName, role, employeeId, hallId = null }) {
  const list = loadMockUsers();
  const normalized = authEmail(email);
  if (!normalized) return { ok: false, error: "البريد غير صالح." };
  if (list.some((u) => u.email === normalized)) {
    return { ok: false, error: "البريد مسجّل مسبقاً." };
  }
  const user = normalizeUser({
    id: nextUserId(list),
    email: normalized,
    password,
    role: normalizeRole(role),
    fullName: fullName.trim(),
    employeeId,
    hallId: hallId ?? getActiveHallId(),
    phone: "",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  });
  saveMockUsers([...list, user]);
  return { ok: true, user };
}

export function updateUserProfile(userId, patch) {
  const list = loadMockUsers();
  const idx = list.findIndex((u) => u.id === userId);
  if (idx < 0) return { ok: false, error: "المستخدم غير موجود." };

  const current = list[idx];
  const nextEmail = patch.email ? authEmail(patch.email) : current.email;
  if (!nextEmail) return { ok: false, error: "البريد غير صالح." };
  if (list.some((u) => u.id !== userId && u.email === nextEmail)) {
    return { ok: false, error: "البريد مستخدم من حساب آخر." };
  }

  const updated = normalizeUser({
    ...current,
    fullName: patch.fullName?.trim() ?? current.fullName,
    email: nextEmail,
    phone: patch.phone !== undefined ? String(patch.phone).trim() : current.phone,
    avatar: patch.avatar !== undefined ? patch.avatar : current.avatar,
    residence: patch.residence !== undefined ? String(patch.residence).trim() : current.residence,
    username: patch.username !== undefined ? String(patch.username).trim() : current.username,
    gender: patch.gender !== undefined ? patch.gender : current.gender,
    birthDate: patch.birthDate !== undefined ? patch.birthDate : current.birthDate,
    jobTitle: patch.jobTitle !== undefined ? String(patch.jobTitle).trim() : current.jobTitle,
  });

  const next = [...list];
  next[idx] = updated;
  saveMockUsers(next);

  const session = getAuthSession();
  if (session?.id == userId) {
    setAuthSession(updated);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  }

  return { ok: true, user: updated };
}

export function verifyCurrentPassword(userId, currentPassword) {
  const user = getUserById(userId);
  if (!user) return { ok: false, error: "المستخدم غير موجود." };
  if (user.password !== currentPassword) {
    return { ok: false, error: "كلمة المرور الحالية غير صحيحة." };
  }
  return { ok: true };
}

export function changeUserPassword(userId, currentPassword, newPassword) {
  const list = loadMockUsers();
  const user = list.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "المستخدم غير موجود." };
  if (user.password !== currentPassword) {
    return { ok: false, error: "كلمة المرور الحالية غير صحيحة." };
  }
  if (!newPassword || newPassword.length < 4) {
    return { ok: false, error: "كلمة المرور الجديدة (4 أحرف على الأقل)." };
  }
  const next = list.map((u) => (u.id === userId ? { ...u, password: newPassword } : u));
  saveMockUsers(next);
  return { ok: true };
}

export function deleteUserAccount(userId, password) {
  const list = loadMockUsers();
  const user = list.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "المستخدم غير موجود." };
  if (user.password !== password) {
    return { ok: false, error: "كلمة المرور غير صحيحة." };
  }
  if (user.role === "manager" && list.filter((u) => u.role === "manager").length <= 1) {
    return { ok: false, error: "لا يمكن حذف آخر حساب مدير." };
  }

  saveMockUsers(list.filter((u) => u.id !== userId));

  if (user.employeeId) {
    const employees = loadEmployees();
    saveEmployees(employees.filter((e) => e.id !== user.employeeId));
  }

  clearAuthSession();
  return { ok: true };
}

export function normalizeSessionRole(role) {
  if (role === "manager" || LEGACY_MANAGER_ROLES.has(role)) return "manager";
  if (role === "maintenance" || LEGACY_MAINTENANCE_ROLES.has(role)) return "maintenance";
  if (role === "reception") return "reception";
  return role;
}

/** هل الجلسة تطابق دور الصفحة (مدير / صيانة) */
export function sessionMatchesRoleHint(session, roleHint) {
  if (!roleHint || !session?.role) return true;
  return normalizeSessionRole(session.role) === normalizeSessionRole(roleHint);
}

/** استعادة جلسة المدير من حساب المدير المحفوظ (عند فتح الملف الشخصي بدون جلسة) */
/** @deprecated API-only mode — mock restore disabled */
export function restoreManagerSessionFromStore() {
  return null;
}

/** Clears non-API staff sessions so testing always requires a real login. */
export function purgeLegacyMockAuth() {
  if (typeof window === "undefined") return;

  try {
    const legacy = readLegacySession();
    if (legacy?.id && !getScopedToken(legacy.id)) {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
    }

    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith(`${SESSION_KEY}::`)) continue;
      const accountId = key.slice(`${SESSION_KEY}::`.length);
      const session = readScopedSession(accountId);
      if (!session) continue;
      if (session.source !== "api" || !getScopedToken(accountId)) {
        clearScopedAccount(accountId);
      }
    }
  } catch {
    /* ignore */
  }
}

function readSessionRaw(accountId) {
  const urlAccountId = accountId ?? getActiveAccountIdFromUrl();
  if (urlAccountId) {
    const scoped = readScopedSession(urlAccountId);
    if (scoped) return JSON.stringify(scoped);
    const migrated = migrateLegacySessionToScoped(urlAccountId);
    if (migrated) return JSON.stringify(migrated);
  }

  try {
    let raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      raw = sessionStorage.getItem(LEGACY_SESSION_KEY);
      if (raw) {
        localStorage.setItem(SESSION_KEY, raw);
        sessionStorage.removeItem(LEGACY_SESSION_KEY);
      }
    }
    return raw;
  } catch {
    return null;
  }
}

export function getManagerApiToken(accountId) {
  const id = accountId ?? getActiveAccountIdFromUrl();
  if (id) {
    const scoped = getScopedToken(id);
    if (scoped) return scoped;
    migrateLegacySessionToScoped(id);
    return getScopedToken(id);
  }
  return localStorage.getItem(MANAGER_TOKEN_KEY) || null;
}

export function clearManagerApiToken(accountId) {
  const id = accountId ?? getActiveAccountIdFromUrl();
  if (id) {
    setScopedToken(id, null);
  }
  localStorage.removeItem(MANAGER_TOKEN_KEY);
}

export function setApiManagerSession(user, token) {
  const accountId = user?.id;
  if (token && accountId != null) {
    setScopedToken(accountId, token);
  }
  return setAuthSession({ ...user, source: "api" });
}

export function setAuthSession(user) {
  const accountId = user?.id;
  const token = accountId != null ? getScopedToken(accountId) : null;
  const isApiSession = user?.source === "api" || Boolean(token);

  if (!isApiSession) {
    return null;
  }

  const loggedInAt = new Date().toISOString();
  const session = {
    id: user.id,
    email: user.email,
    role: normalizeSessionRole(user.role),
    fullName: user.fullName,
    employeeId: user.employeeId ?? null,
    hallId: user.hallId ?? null,
    stationName: user.stationName ?? null,
    avatar: user.avatar || "",
    phone: user.phone || "",
    joinDate: user.joinDate || "",
    source: "api",
    loggedInAt,
  };
  try {
    if (user.id != null) {
      writeScopedSession(user.id, session);
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
    }
  } catch {
    /* ignore */
  }

  if (user.employeeId) {
    const employees = loadEmployees();
    saveEmployees(
      employees.map((e) =>
        e.id === user.employeeId ? { ...e, lastLogin: loggedInAt } : e,
      ),
    );
  }

  return session;
}

export function getAuthSession(accountId) {
  try {
    const resolvedId = accountId ?? getActiveAccountIdFromUrl();
    let raw = readSessionRaw(resolvedId);

    if (!raw && !resolvedId) {
      const any = findScopedManagerSession();
      if (any) raw = JSON.stringify(any);
    }

    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id && !parsed?.email) return null;

    if (resolvedId && parsed.id != null && String(parsed.id) !== String(resolvedId)) {
      return null;
    }

    const token = getManagerApiToken(parsed.id ?? resolvedId);
    if (parsed.source === "api" && token) {
      return {
        ...parsed,
        source: "api",
        role: normalizeSessionRole(parsed.role || "manager"),
        hallId: parsed.hallId ?? null,
        stationName: parsed.stationName ?? null,
      };
    }

    if (token) {
      return {
        ...parsed,
        source: "api",
        role: normalizeSessionRole(parsed.role || "manager"),
        hallId: parsed.hallId ?? null,
        stationName: parsed.stationName ?? null,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function clearAuthSession(accountId) {
  try {
    const resolvedId = accountId ?? getActiveAccountIdFromUrl();
    if (resolvedId) {
      clearScopedAccount(resolvedId);
    }
    const legacy = readLegacySession();
    if (!resolvedId || legacy?.id == resolvedId) {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
      clearManagerApiToken(resolvedId);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
    }
  } catch {
    /* ignore */
  }
}

export function getLoginRedirectPath(role, userId) {
  if (role === "manager") {
    const id = userId ?? getAuthSession()?.id;
    return id != null ? buildManagerWorkspacePath(id, "dashboard") : MANAGER_LOGIN_PATH;
  }
  if (role === "maintenance") {
    const id = userId ?? getAuthSession()?.id;
    return id != null ? buildMaintenanceWorkspacePath(id) : EMPLOYEE_LOGIN_PATH;
  }
  const id = userId ?? getAuthSession()?.id;
  return id != null ? buildReceptionWorkspacePath(id) : EMPLOYEE_LOGIN_PATH;
}
