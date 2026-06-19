import { isDeviceBroken, isDeviceRepairInProgress } from "../../devices-packages/utils/deviceFaultSync";

export const FAULT_TYPES = [
  { value: "screen", label: "عطل شاشة" },
  { value: "controller", label: "عطل تحكم" },
  { value: "network", label: "عطل شبكة" },
  { value: "audio", label: "عطل صوت" },
  { value: "power", label: "عطل تشغيل" },
  { value: "other", label: "أخرى" },
];

export const FAULT_STATUSES = [
  { value: "pending", label: "معطل" },
  { value: "resolved", label: "تم الإصلاح" },
];

const STATUS_TONE_CLASS = {
  red: "bg-red-500/15 text-red-600 dark:text-red-400",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  muted: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

/** شارة حالة العطل في جدول الأجهزة */
export function deviceFaultUiStatus(device) {
  if (!device) return { key: "unknown", label: "—", tone: "muted" };
  if (isDeviceRepairInProgress(device)) {
    return { key: "repairing", label: "تحت الصيانة", tone: "amber" };
  }
  if (isDeviceBroken(device)) {
    return { key: "broken", label: "معطل", tone: "red" };
  }
  return { key: "healthy", label: "سليم", tone: "green" };
}

/** شارة حالة سجل العطل في جدول الأعطال */
export function faultRowDisplayStatus(row, device) {
  if (isDeviceRepairInProgress(device)) {
    return { key: "repairing", label: "قيد الإصلاح", tone: "amber" };
  }
  return { key: "waiting", label: "في الانتظار", tone: "red" };
}

export function faultStatusBadgeClass(tone) {
  return STATUS_TONE_CLASS[tone] || STATUS_TONE_CLASS.muted;
}

export function parseDeviceCreatedAt(createdAt) {
  if (!createdAt) return null;
  const datePart = String(createdAt).split("—")[0]?.trim().replace(/\//g, "-");
  if (!datePart) return null;
  const d = new Date(datePart);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function minFaultDateInputValue(device) {
  const created = parseDeviceCreatedAt(device?.createdAt);
  if (!created) return undefined;
  return toDateInputValue(created);
}

export function isFaultDateValidForDevice(device, dateInputValue) {
  if (!dateInputValue) return false;
  const faultDate = new Date(`${dateInputValue}T12:00:00`);
  const created = parseDeviceCreatedAt(device?.createdAt);
  if (!created) return true;
  created.setHours(0, 0, 0, 0);
  faultDate.setHours(0, 0, 0, 0);
  return faultDate >= created;
}

export function formatDeviceDisplayText(deviceOrRow) {
  if (!deviceOrRow) return { name: "—", subtitle: "" };
  const name = deviceOrRow.name || deviceOrRow.deviceName || "—";
  const type = deviceOrRow.typeLabel || deviceOrRow.deviceTypeLabel || "";
  const id = deviceOrRow.id ?? deviceOrRow.deviceId;
  const subtitle = [type, id != null ? `رقم ${id}` : ""].filter(Boolean).join(" — ");
  return { name, subtitle };
}

export function formatFaultCost(amount) {
  const n = Number(amount) || 0;
  return `${new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 0 }).format(n)} د.ل`;
}

export function faultTypeLabel(value, customLabel) {
  if (value === "other" && customLabel?.trim()) {
    return customLabel.trim();
  }
  return FAULT_TYPES.find((t) => t.value === value)?.label ?? value ?? "—";
}

export function faultStatusLabel(value) {
  return FAULT_STATUSES.find((s) => s.value === value)?.label ?? "—";
}

/** عرض تاريخ فقط — بدون وقت */
export function formatDisplayDate(value) {
  if (value == null || value === "" || value === "—") return "—";
  const str = String(value).trim();
  if (str.includes("—")) return str.split("—")[0].trim();
  const d = value instanceof Date ? value : new Date(str);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("ar-LY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
  return str;
}

export function formatFaultDateTime(date = new Date()) {
  return formatDisplayDate(date instanceof Date ? date : new Date(date));
}

export function toDateInputValue(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
