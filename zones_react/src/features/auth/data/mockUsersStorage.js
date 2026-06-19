import { normalizeRole } from "../../employees/data/employeeMeta";
import { loadEmployees, saveEmployees } from "../../employees/data/employeesStorage";

const USERS_KEY = "zones-mock-users";
const SESSION_KEY = "zones-auth-session";
const LEGACY_SESSION_KEY = "zones-auth-session"; // كان في sessionStorage
export const PROFILE_UPDATED_EVENT = "zones-profile-updated";
export const AUTH_SESSION_EVENT = "zones-auth-session-updated";

/** أدوار قديمة في الجلسة أو المستخدمين */
const LEGACY_MANAGER_ROLES = new Set(["admin", "supervisor"]);
const LEGACY_MAINTENANCE_ROLES = new Set(["technician"]);

const DEFAULT_MANAGER_AVATAR =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face";

const DEFAULT_USERS = [
  {
    id: 1,
    email: "manager@zones.ly",
    password: "admin123",
    role: "manager",
    fullName: "أحمد المدير",
    employeeId: null,
    phone: "+218 91 000 0000",
    avatar: DEFAULT_MANAGER_AVATAR,
    residence: "طرابلس، ليبيا",
    username: "ahmed_manager",
    gender: "male",
    birthDate: "1990-05-15",
    jobTitle: "مدير صالة",
    joinDate: "2024-01-15",
  },
  {
    id: 2,
    email: "khaled@zones.ly",
    password: "1234",
    role: "maintenance",
    fullName: "خالد بوزريدة",
    employeeId: 4,
    phone: "+218 91 770 9920",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    residence: "طرابلس — عين زارة",
    username: "khaled_maint",
    gender: "male",
    birthDate: "",
    jobTitle: "موظف صيانة",
    joinDate: "2023-11-20",
  },
  {
    id: 3,
    email: "ahmed@zones.ly",
    password: "1234",
    role: "reception",
    fullName: "أحمد العقيبي",
    employeeId: 1,
    phone: "+218 91 234 5678",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    residence: "طرابلس — حي الأندلس",
    username: "ahmed_reception",
    gender: "male",
    birthDate: "1995-08-12",
    jobTitle: "موظف استقبال",
    joinDate: "2024-03-15",
  },
];

function normalizeUser(row) {
  return {
    ...row,
    phone: row.phone || "",
    avatar: row.avatar || "",
    residence: row.residence || "",
    username: row.username || "",
    gender: row.gender || "",
    birthDate: row.birthDate || "",
    jobTitle: row.jobTitle || "مدير صالة",
    joinDate: row.joinDate || "2024-01-15",
    active: row.active !== false,
  };
}

function loadUsersRaw() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeUser) : null;
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

export function loadMockUsers() {
  const stored = loadUsersRaw();
  if (!stored?.length) {
    saveMockUsers(DEFAULT_USERS);
    return DEFAULT_USERS.map(normalizeUser);
  }
  const { users, changed } = ensureDefaultUsers(stored);
  const { users: withIdentity, changed: identityChanged } = ensureDemoAccountIdentity(users);
  const { users: repaired, changed: repairedChanged } = repairDemoAccountNamesOnce(withIdentity);
  const { users: withPhotos, changed: photosChanged } = ensureDefaultProfilePhotos(repaired);
  if (changed || identityChanged || repairedChanged || photosChanged) saveMockUsers(withPhotos);
  return withPhotos;
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
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
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
    (emails || []).map((e) => String(e || "").trim().toLowerCase()).filter(Boolean),
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
    (emails || []).map((e) => String(e || "").trim().toLowerCase()).filter(Boolean),
  );
  if (!targets.size) return;

  try {
    const raw = readSessionRaw();
    if (!raw) return;
    const session = JSON.parse(raw);
    if (session?.email && targets.has(String(session.email).trim().toLowerCase())) {
      clearAuthSession();
    }
  } catch {
    /* ignore */
  }
}

export function registerManagerUser({ email, password, fullName, phone, hallId = null }) {
  const list = loadMockUsers();
  const normalized = String(email).trim().toLowerCase();
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

export function registerEmployeeUser({ email, password, fullName, role, employeeId }) {
  const list = loadMockUsers();
  const normalized = String(email).trim().toLowerCase();
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
  const nextEmail = patch.email
    ? String(patch.email).trim().toLowerCase()
    : current.email;
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
    return { ok: false, error: "الرمز الحالي غير صحيح." };
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
export function restoreManagerSessionFromStore() {
  const mgr =
    loadMockUsers().find((u) => u.role === "manager") ||
    loadMockUsers().find((u) => LEGACY_MANAGER_ROLES.has(u.role));
  if (!mgr) return null;
  return setAuthSession(mgr);
}

function readSessionRaw() {
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

export function setAuthSession(user) {
  const loggedInAt = new Date().toISOString();
  const session = {
    id: user.id,
    email: user.email,
    role: normalizeSessionRole(user.role),
    fullName: user.fullName,
    employeeId: user.employeeId ?? null,
    avatar: user.avatar || "",
    phone: user.phone || "",
    joinDate: user.joinDate || "",
    loggedInAt,
  };
  try {
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

export function getAuthSession() {
  try {
    const raw = readSessionRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id) return null;

    const user = getUserById(parsed.id);
    if (!user || user.active === false) {
      clearAuthSession();
      return null;
    }

    return {
      ...parsed,
      role: normalizeSessionRole(parsed.role),
    };
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function getLoginRedirectPath(role) {
  if (role === "manager") return "/dashboard";
  if (role === "maintenance") return "/employee/maintenance";
  return "/employee/reception";
}
