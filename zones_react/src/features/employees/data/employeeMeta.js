export const ROLES = [
  { value: "reception", label: "موظف استقبال" },
  { value: "maintenance", label: "موظف صيانة" },
];

/** أدوار قديمة في التخزين المحلي → الوظيفتان الحاليتان */
const LEGACY_ROLE_MAP = {
  supervisor: "reception",
  cashier: "reception",
  admin: "reception",
  technician: "maintenance",
};

export function normalizeRole(value) {
  if (value === "reception" || value === "maintenance") return value;
  return LEGACY_ROLE_MAP[value] ?? "reception";
}

export const ROLE_PERMISSIONS = {
  reception: ["الاستقبال والحجوزات", "إدارة الزبائن", "تسجيل الدخول والخروج"],
  maintenance: ["صيانة الأجهزة", "إصلاح الأعطال", "متابعة الشبكة والمعدات"],
};

export const SHIFTS = [
  { value: "morning", label: "فترة صباحية", hours: "من 2 مساءً إلى 8 مساءً" },
  { value: "evening", label: "فترة مسائية", hours: "من 8 مساءً إلى 2 صباحاً" },
  { value: "full_time", label: "دوام كامل", hours: "من 2 مساءً إلى 2 صباحاً" },
];

const LEGACY_SHIFT_MAP = {
  night: "evening",
  flexible: "morning",
  fulltime: "full_time",
};

export function normalizeShift(value) {
  if (value === "morning" || value === "evening" || value === "full_time") return value;
  return LEGACY_SHIFT_MAP[value] ?? "morning";
}

export const STATUSES = [
  { value: "working", label: "يعمل" },
  { value: "leave", label: "إجازة" },
];

export const GENDERS = [
  { value: "male", label: "ذكر" },
  { value: "female", label: "أنثى" },
];

/** أيام الأسبوع السبعة — للاختيار المتعدد */
export const WEEK_DAYS = [
  { value: "sat", label: "السبت", short: "سبت" },
  { value: "sun", label: "الأحد", short: "أحد" },
  { value: "mon", label: "الاثنين", short: "إثنين" },
  { value: "tue", label: "الثلاثاء", short: "ثلاثاء" },
  { value: "wed", label: "الأربعاء", short: "أربعاء" },
  { value: "thu", label: "الخميس", short: "خميس" },
  { value: "fri", label: "الجمعة", short: "جمعة" },
];

const LEGACY_WORK_DAYS_MAP = {
  "sat-thu": ["sat", "sun", "mon", "tue", "wed", "thu"],
  "sun-thu": ["sun", "mon", "tue", "wed", "thu"],
  daily: ["sat", "sun", "mon", "tue", "wed", "thu", "fri"],
  custom: [],
};

export function parseWorkDays(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (LEGACY_WORK_DAYS_MAP[value]) return [...LEGACY_WORK_DAYS_MAP[value]];
  return value.split(",").map((d) => d.trim()).filter(Boolean);
}

export function serializeWorkDays(days) {
  const order = WEEK_DAYS.map((d) => d.value);
  return [...days]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .join(",");
}

export const WORK_DAYS_OPTIONS = WEEK_DAYS;

export const WORK_INFO_TYPES = [
  { value: "full_time", label: "دوام كامل" },
  { value: "part_time", label: "دوام جزئي" },
];

export const ACCOUNT_STATUSES = [
  { value: "active", label: "نشط" },
  { value: "suspended", label: "موقوف" },
  { value: "archived", label: "مؤرشف" },
];

const LEGACY_STATUS_MAP = {
  active: "working",
  on_shift: "working",
  inactive: "leave",
};

export function normalizeStatus(value) {
  if (value === "working" || value === "leave") return value;
  return LEGACY_STATUS_MAP[value] ?? "working";
}

export function roleLabel(value) {
  if (value === "manager" || value === "admin" || value === "supervisor") {
    return "مدير النظام";
  }
  return ROLES.find((r) => r.value === normalizeRole(value))?.label ?? "—";
}

export function shiftLabel(value) {
  const shift = SHIFTS.find((s) => s.value === normalizeShift(value));
  if (!shift) return "—";
  return `${shift.label} (${shift.hours})`;
}

export function statusLabel(value) {
  return STATUSES.find((s) => s.value === normalizeStatus(value))?.label ?? "—";
}

export function formatSalary(value) {
  const n = Number(value);
  if (!n) return "—";
  return `${new Intl.NumberFormat("ar-LY").format(n)} د.ل`;
}

export function genderLabel(value) {
  return GENDERS.find((g) => g.value === value)?.label ?? "—";
}

export function workDaysLabel(value) {
  const days = parseWorkDays(value);
  if (!days.length) return "—";
  return days
    .map((d) => WEEK_DAYS.find((w) => w.value === d)?.label ?? d)
    .join("، ");
}

export function workInfoTypeLabel(value) {
  return WORK_INFO_TYPES.find((t) => t.value === value)?.label ?? "—";
}

export function accountStatusLabel(value) {
  return ACCOUNT_STATUSES.find((s) => s.value === value)?.label ?? "—";
}

export function formatDateAr(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-LY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDateTimeAr(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-LY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export const EMPTY_EMPLOYEE = {
  fullName: "",
  phone: "",
  email: "",
  role: "reception",
  shift: "morning",
  status: "working",
  hireDate: "",
  salary: "",
  notes: "",
  address: "",
  gender: "male",
  birthDate: "",
  workStartDate: "",
  workDays: "",
  workHours: "",
  workInfoType: "full_time",
  photoUrl: "",
};
