import { loadManagerHall } from "../../lounge/data/managerHallStorage";
import { normalizeRole, normalizeShift, normalizeStatus } from "./employeeMeta";
import { normalizeGmailEmail } from "../../../shared/utils/normalizeGmailEmail";
import { hallScopedKey } from "../../../shared/tenant/hallScopedStorage";
import { getActiveAccountIdFromUrl } from "../../auth/data/accountSessionStorage";
import { getAuthSession, getManagerApiToken } from "../../auth/data/mockUsersStorage";
import { fetchManagerEmployees, updateManagerEmployee, cancelManagerInvitation } from "./managerEmployeesApi";

const BASE_KEY = "zones-employees-v2";
const storageKey = () => hallScopedKey(BASE_KEY);

export const EMPLOYEES_STORAGE_EVENT = "zones-employees-updated";

function notifyEmployeesUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EMPLOYEES_STORAGE_EVENT));
}

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face";

function normalizeEmployee(row) {
  const hallName = loadManagerHall().hallName;
  const role = normalizeRole(row.role);
  const isArchived = Boolean(row.isArchived);

  return {
    ...row,
    email: normalizeGmailEmail(row.email),
    role,
    shift: normalizeShift(row.shift),
    status: normalizeStatus(row.status),
    joinDate: row.joinDate || row.hireDate || "",
    workStartDate: row.workStartDate || row.hireDate || "",
    hallName: row.hallName || hallName,
    gender: row.gender || "male",
    address: row.address || "",
    photoUrl: row.photoUrl || DEFAULT_PHOTO,
    birthDate: row.birthDate || "",
    workDays: row.workDays || "",
    workHours: row.workHours || "",
    workInfoType: row.workInfoType || "full_time",
    accountStatus: isArchived ? "archived" : row.accountStatus || "active",
    lastLogin: row.lastLogin || null,
    lastOperation: row.lastOperation || "—",
    operationsThisMonth: Number(row.operationsThisMonth) || 0,
    isArchived,
    archivedAt: row.archivedAt || null,
  };
}

export function loadEmployees() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [];
    const normalized = parsed.map(normalizeEmployee);
    const emailChanged = parsed.some((row, i) => normalizeGmailEmail(row.email) !== row.email);
    if (emailChanged) saveEmployees(normalized);
    return normalized;
  } catch {
    return [];
  }
}

export function saveEmployees(list) {
  try {
    const serialized = JSON.stringify(list.map(normalizeEmployee));
    const prev = localStorage.getItem(storageKey());
    if (prev === serialized) return;
    localStorage.setItem(storageKey(), serialized);
    notifyEmployeesUpdated();
  } catch {
    /* ignore */
  }
}

export function nextEmployeeId(list) {
  return list.reduce((max, e) => Math.max(max, e.id ?? 0), 0) + 1;
}

export function filterEmployeesByRole(list, role, { archived = false } = {}) {
  return list.filter((e) => e.isArchived === archived && normalizeRole(e.role) === role);
}

export function filterArchivedEmployees(list) {
  return list.filter((e) => e.isArchived);
}

export function archiveEmployee(list, id) {
  const now = new Date().toISOString();
  return list.map((e) =>
    e.id === id
      ? { ...e, isArchived: true, archivedAt: now, accountStatus: "archived" }
      : e,
  );
}

export function restoreEmployee(list, id) {
  return list.map((e) =>
    e.id === id
      ? { ...e, isArchived: false, archivedAt: null, accountStatus: "active" }
      : e,
  );
}

function isApiManagerSession(session) {
  if (!session || session.role !== "manager") return false;
  if (session.source !== "api") return false;
  const accountId = session.id ?? getActiveAccountIdFromUrl();
  return Boolean(getManagerApiToken(accountId));
}

export async function refreshEmployeesFromApi() {
  const accountId = getActiveAccountIdFromUrl();
  const session = getAuthSession(accountId);
  if (!isApiManagerSession(session)) {
    return { ok: false, skipped: true, error: "لا توجد جلسة API نشطة للمدير." };
  }

  const result = await fetchManagerEmployees();
  if (!result.ok) return result;

  saveEmployees(result.employees);
  return { ok: true, employees: result.employees };
}

export async function persistEmployeeArchiveApi(row) {
  if (!row?.userId || row.isPendingInvite) {
    return { ok: false, error: "لا يمكن أرشفة هذا السجل" };
  }

  const result = await updateManagerEmployee(row.userId, {
    isArchived: true,
    accountStatus: "archived",
  });

  if (!result.ok) return result;
  await refreshEmployeesFromApi();
  return result;
}

export async function persistCancelInvitation(row) {
  if (!row?.invitationId) {
    return { ok: false, error: "لا يمكن إلغاء هذه الدعوة" };
  }

  const result = await cancelManagerInvitation(row.invitationId);
  if (!result.ok) return result;
  await refreshEmployeesFromApi();
  return result;
}
