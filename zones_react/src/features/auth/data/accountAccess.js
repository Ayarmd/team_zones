import { findUserByEmail, getUserById } from "./mockUsersStorage";
import { getSuperAdminState } from "../../super-admin/data/superAdminStorage";
import { authenticateSuperAdmin } from "../../super-admin/data/superAdminAuth";
import { normalizeGmailEmail } from "../../../shared/utils/normalizeGmailEmail";

export const LOGIN_BLOCK_CODES = {
  INVALID: "invalid",
  MANAGER_DISABLED: "manager_disabled",
  EMPLOYEE_DISABLED: "employee_disabled",
};

export const LOGIN_BLOCK_MESSAGES = {
  [LOGIN_BLOCK_CODES.INVALID]: "البريد أو كلمة المرور غير صحيحة.",
  [LOGIN_BLOCK_CODES.MANAGER_DISABLED]: "عذراً، لقد تم تعطيل حسابك والصالة والموظفين.",
  [LOGIN_BLOCK_CODES.EMPLOYEE_DISABLED]: "تم تعطيل حسابك من قبل الأدمن.",
};

function normalizeEmail(email) {
  return normalizeGmailEmail(String(email || "").trim().toLowerCase());
}

function findSuperAdminManagerByEmail(email) {
  const normalized = normalizeEmail(email);
  return getSuperAdminState().managers.find((m) => normalizeEmail(m.email) === normalized) ?? null;
}

function findSuperAdminEmployeeByEmail(email) {
  const normalized = normalizeEmail(email);
  return getSuperAdminState().employees.find((e) => normalizeEmail(e.email) === normalized) ?? null;
}

function isHallBlockedForLogin(hallName, state) {
  const hall = state.activeHalls.find((h) => h.name === hallName);
  if (!hall) return false;
  if (hall.status === "closed") {
    const mgr = state.managers.find((m) => m.id === hall.managerId);
    if (mgr && !mgr.active) return true;
  }
  return false;
}

/** سبب منع الدخول حسب بيانات الأدمن وحالة الحساب المحلية */
export function getAccountBlockCode(user) {
  if (!user) return LOGIN_BLOCK_CODES.INVALID;
  if (user.active === false) {
    return user.role === "manager"
      ? LOGIN_BLOCK_CODES.MANAGER_DISABLED
      : LOGIN_BLOCK_CODES.EMPLOYEE_DISABLED;
  }

  const state = getSuperAdminState();
  const managerRecord = findSuperAdminManagerByEmail(user.email);
  if (managerRecord) {
    if (!managerRecord.active) return LOGIN_BLOCK_CODES.MANAGER_DISABLED;
    return null;
  }

  const employeeRecord = findSuperAdminEmployeeByEmail(user.email);
  if (employeeRecord) {
    if (!employeeRecord.active) return LOGIN_BLOCK_CODES.EMPLOYEE_DISABLED;
    for (const hallName of employeeRecord.assignedHalls || []) {
      if (isHallBlockedForLogin(hallName, state)) {
        return LOGIN_BLOCK_CODES.EMPLOYEE_DISABLED;
      }
    }
  }

  return null;
}

export function attemptLogin(email, password) {
  const normalizedEmail = normalizeGmailEmail(email);
  const superAdmin = authenticateSuperAdmin(normalizedEmail, password);
  if (superAdmin) {
    return { ok: true, accountType: "super_admin", user: superAdmin };
  }

  const user = findUserByEmail(normalizedEmail);
  if (!user || user.password !== password) {
    return { ok: false, code: LOGIN_BLOCK_CODES.INVALID };
  }

  const blockCode = getAccountBlockCode(user);
  if (blockCode) {
    return { ok: false, code: blockCode };
  }

  return { ok: true, accountType: "staff", user };
}

export function isSessionUserAllowed(session) {
  if (!session?.id) return false;
  const user = getUserById(session.id);
  if (!user) return false;
  return !getAccountBlockCode(user);
}
