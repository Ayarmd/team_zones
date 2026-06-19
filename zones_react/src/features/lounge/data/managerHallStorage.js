import { getAuthSession } from "../../auth/data/mockUsersStorage";
import {
  createDefaultAccessoriesAvailability,
  createDefaultServicesAvailability,
  getAvailableHallServices,
  normalizeAccessoriesAvailability,
  normalizeServicesAvailability,
} from "../../super-admin/data/hallServicesData";

const STORAGE_KEY = "zones-manager-hall-data-v1";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=480&fit=crop";

export const HALL_TYPES = [
  "صالة ألعاب",
  "صالة VIP",
  "مجمع ترفيهي",
  "صالة بطولات",
  "مركز ألعاب إلكترونية",
];

export const HALL_STATUS = {
  active: { key: "active", label: "نشطة", color: "emerald" },
  disabled: { key: "disabled", label: "معطلة", color: "red" },
  pending: { key: "pending", label: "معلقة", color: "amber" },
};

/** ساعات عمل الصالة الافتراضية: من 2 مساءً إلى 2 صباحاً */
export const DEFAULT_WORK_HOURS_FROM = "14:00";
export const DEFAULT_WORK_HOURS_TO = "02:00";

const DEFAULT_HALL = {
  hallName: "ZONES Gaming Center",
  hallType: "صالة ألعاب",
  city: "طرابلس",
  address: "حي الأندلس — شارع الجمهورية",
  mapLink: "https://maps.google.com/?q=32.8872,13.1913",
  phone: "091 234 5678",
  email: "manager@gmail.com",
  managerName: "أحمد المدير",
  employeeCount: 6,
  workHoursFrom: DEFAULT_WORK_HOURS_FROM,
  workHoursTo: DEFAULT_WORK_HOURS_TO,
  joinDate: null,
  status: "active",
  image: DEFAULT_IMAGE,
  /** @type {Record<string, boolean>} is_available لكل خدمة — يحدّدها المدير */
  servicesAvailability: createDefaultServicesAvailability(),
  /** ملحقات الألعاب الفرعية — is_available لكل عنصر */
  accessoriesAvailability: createDefaultAccessoriesAvailability(),
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_HALL,
      ...parsed,
      servicesAvailability: normalizeServicesAvailability(parsed?.servicesAvailability),
      accessoriesAvailability: normalizeAccessoriesAvailability(
        parsed?.accessoriesAvailability,
        parsed?.servicesAvailability,
      ),
    };
  } catch {
    return null;
  }
}

function formatHourAr(time) {
  const h = Number.parseInt(String(time).split(":")[0], 10);
  if (!Number.isFinite(h)) return time;
  if (h === 0) return "12:00 صباحاً";
  if (h === 12) return "12:00 ظهراً";
  if (h < 12) return `${h}:00 صباحاً`;
  if (h === 13) return "1:00 مساءً";
  if (h === 14) return "2:00 مساءً";
  return `${h - 12}:00 مساءً`;
}

/** نص عربي لساعات عمل الصالة */
export function formatHallWorkHours(from, to) {
  const start = from || DEFAULT_WORK_HOURS_FROM;
  const end = to || DEFAULT_WORK_HOURS_TO;
  return `من ${formatHourAr(start)} إلى ${formatHourAr(end)}`;
}

export function loadManagerHall() {
  const session = getAuthSession();
  const stored = readStored();
  let data = {
    ...DEFAULT_HALL,
    ...(stored || {}),
    servicesAvailability: normalizeServicesAvailability(stored?.servicesAvailability),
    accessoriesAvailability: normalizeAccessoriesAvailability(
      stored?.accessoriesAvailability,
      stored?.servicesAvailability,
    ),
  };
  let shouldPersist = false;

  if (data.workHoursFrom === "09:00" || data.workHoursFrom === "12:00") {
    data.workHoursFrom = DEFAULT_WORK_HOURS_FROM;
    shouldPersist = true;
  }
  if (!data.workHoursTo) {
    data.workHoursTo = DEFAULT_WORK_HOURS_TO;
    shouldPersist = true;
  }

  if (!data.joinDate) {
    data.joinDate = session?.joinDate || todayIso();
    shouldPersist = true;
  }
  if (!readStored() && session?.fullName && session.role === "manager") {
    data.managerName = session.fullName;
    data.email = session.email || data.email;
    shouldPersist = true;
  }

  if (shouldPersist) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  return data;
}

export function saveManagerHall(patch) {
  const current = readStored() || { ...DEFAULT_HALL, joinDate: todayIso() };
  const next = {
    ...current,
    ...patch,
    servicesAvailability: patch.servicesAvailability
      ? normalizeServicesAvailability(patch.servicesAvailability)
      : current.servicesAvailability,
    accessoriesAvailability: patch.accessoriesAvailability
      ? normalizeAccessoriesAvailability(patch.accessoriesAvailability, patch.servicesAvailability)
      : current.accessoriesAvailability,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("manager-hall-updated"));
  return next;
}

/** محاكاة استعلام Backend للزبون: WHERE is_available = 1 */
export function fetchCustomerHallServices() {
  const hall = loadManagerHall();
  return {
    hallName: hall.hallName,
    city: hall.city,
    image: hall.image,
    services: getAvailableHallServices(hall.servicesAvailability, hall.accessoriesAvailability),
  };
}

/** الحالة والانضمام — يحددهما النظام/الأدمن فقط */
export function setHallStatusByAdmin(status) {
  if (!HALL_STATUS[status]) return loadManagerHall();
  return saveManagerHall({ status });
}

export function getHallStatusMeta(status) {
  return HALL_STATUS[status] || HALL_STATUS.pending;
}
