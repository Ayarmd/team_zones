import { loadManagerHall } from "../../lounge/data/managerHallStorage";
import { normalizeRole, normalizeShift, normalizeStatus } from "./employeeMeta";

const STORAGE_KEY = "zones-employees";

export const EMPLOYEES_STORAGE_EVENT = "zones-employees-updated";

function notifyEmployeesUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EMPLOYEES_STORAGE_EVENT));
}

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face";

const DEFAULT_EMPLOYEES = [
  {
    id: 1,
    fullName: "أحمد العقيبي",
    phone: "+218 91 234 5678",
    email: "ahmed@zones.ly",
    role: "reception",
    shift: "evening",
    status: "working",
    hireDate: "2024-03-15",
    joinDate: "2024-03-15",
    workStartDate: "2024-03-15",
    salary: 1800,
    notes: "استقبال وردية مسائية.",
    hoursThisMonth: 168,
    shiftsThisMonth: 22,
    address: "طرابلس — حي الأندلس",
    gender: "male",
    birthDate: "1995-08-12",
    workDays: "sat,sun,mon,tue,wed,thu",
    workHours: "14:00 — 22:00",
    workInfoType: "full_time",
    photoUrl: DEFAULT_PHOTO,
    lastLogin: "2026-06-07T21:34:00",
    lastOperation: "فتح جلسة لعب",
    operationsThisMonth: 142,
    isArchived: false,
    accountStatus: "active",
  },
  {
    id: 2,
    fullName: "محمد الفيتوري",
    phone: "+218 92 881 2044",
    email: "m.faitouri@zones.ly",
    role: "reception",
    shift: "morning",
    status: "working",
    hireDate: "2025-01-08",
    joinDate: "2025-01-08",
    workStartDate: "2025-01-08",
    salary: 1200,
    notes: "",
    hoursThisMonth: 152,
    shiftsThisMonth: 20,
    address: "طرابلس — قرقارش",
    gender: "male",
    birthDate: "",
    workDays: "sun,mon,tue,wed,thu",
    workHours: "09:00 — 17:00",
    workInfoType: "full_time",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    lastLogin: "2026-06-08T08:15:00",
    lastOperation: "تسجيل دخول عميل",
    operationsThisMonth: 98,
    isArchived: false,
    accountStatus: "active",
  },
  {
    id: 3,
    fullName: "سارة المنصوري",
    phone: "+218 94 550 3311",
    email: "sara.m@zones.ly",
    role: "reception",
    shift: "evening",
    status: "working",
    hireDate: "2025-06-01",
    joinDate: "2025-06-01",
    workStartDate: "2025-06-01",
    salary: 1250,
    notes: "",
    hoursThisMonth: 140,
    shiftsThisMonth: 18,
    address: "بنغازي — الصابري",
    gender: "female",
    birthDate: "1998-03-22",
    workDays: "sat,sun,mon,tue,wed,thu",
    workHours: "16:00 — 00:00",
    workInfoType: "part_time",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    lastLogin: "2026-06-07T19:42:00",
    lastOperation: "حجز باقة",
    operationsThisMonth: 115,
    isArchived: false,
    accountStatus: "active",
  },
  {
    id: 4,
    fullName: "خالد بوزريدة",
    phone: "+218 91 770 9920",
    email: "khaled@zones.ly",
    role: "maintenance",
    shift: "evening",
    status: "working",
    hireDate: "2023-11-20",
    joinDate: "2023-11-20",
    workStartDate: "2023-11-20",
    salary: 1600,
    notes: "صيانة الأجهزة والشبكة.",
    hoursThisMonth: 176,
    shiftsThisMonth: 24,
    address: "طرابلس — عين زارة",
    gender: "male",
    workDays: "sat,sun,mon,tue,wed,thu,fri",
    workHours: "12:00 — 20:00",
    workInfoType: "full_time",
    photoUrl: DEFAULT_PHOTO,
    lastLogin: "2026-06-08T07:50:00",
    lastOperation: "إغلاق بلاغ صيانة",
    operationsThisMonth: 37,
    isArchived: false,
    accountStatus: "active",
  },
  {
    id: 5,
    fullName: "يوسف الكيلاني",
    phone: "+218 92 440 1188",
    email: "y.kilani@zones.ly",
    role: "maintenance",
    shift: "evening",
    status: "leave",
    hireDate: "2022-05-01",
    joinDate: "2022-05-01",
    workStartDate: "2022-05-01",
    salary: 0,
    notes: "موقوف مؤقتاً.",
    hoursThisMonth: 0,
    shiftsThisMonth: 0,
    address: "مصراتة",
    gender: "male",
    workDays: "",
    workHours: "",
    workInfoType: "full_time",
    photoUrl: DEFAULT_PHOTO,
    lastLogin: "2026-05-20T14:10:00",
    lastOperation: "تحديث حالة جهاز",
    operationsThisMonth: 0,
    isArchived: false,
    accountStatus: "suspended",
  },
];

function normalizeEmployee(row) {
  const hallName = loadManagerHall().hallName;
  const role = normalizeRole(row.role);
  const isArchived = Boolean(row.isArchived);

  return {
    ...row,
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_EMPLOYEES.map(normalizeEmployee);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_EMPLOYEES.map(normalizeEmployee);
    return parsed.map(normalizeEmployee);
  } catch {
    return DEFAULT_EMPLOYEES.map(normalizeEmployee);
  }
}

export function saveEmployees(list) {
  try {
    const serialized = JSON.stringify(list.map(normalizeEmployee));
    const prev = localStorage.getItem(STORAGE_KEY);
    if (prev === serialized) return;
    localStorage.setItem(STORAGE_KEY, serialized);
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
