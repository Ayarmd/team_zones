import { DEVICE_TYPE_LABEL } from "./deviceNaming";

const STORAGE_KEY = "zones-custom-device-types-v1";

export const CUSTOM_DEVICE_TYPES_EVENT = "zones-custom-device-types-updated";

const BUILTIN_LABELS = new Set(
  Object.values(DEVICE_TYPE_LABEL).map((label) => label.trim().toLowerCase()),
);

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CUSTOM_DEVICE_TYPES_EVENT));
}

export function slugifyDeviceType(label) {
  return (
    String(label || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w\u0600-\u06FF-]/g, "") || "custom"
  );
}

export function isBuiltinDeviceTypeLabel(label) {
  return BUILTIN_LABELS.has(String(label || "").trim().toLowerCase());
}

export function loadCustomDeviceTypes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => ({
        type: String(row.type || slugifyDeviceType(row.typeLabel)).trim(),
        typeLabel: String(row.typeLabel || "").trim(),
      }))
      .filter((row) => row.typeLabel && !isBuiltinDeviceTypeLabel(row.typeLabel));
  } catch {
    return [];
  }
}

export function saveCustomDeviceType({ type, typeLabel }) {
  const label = String(typeLabel || "").trim();
  if (!label || isBuiltinDeviceTypeLabel(label)) return false;

  const list = loadCustomDeviceTypes();
  const lower = label.toLowerCase();
  if (list.some((row) => row.typeLabel.toLowerCase() === lower)) return false;

  const next = [...list, { type: type || slugifyDeviceType(label), typeLabel: label }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notifyUpdated();
  return true;
}

/** دمج الأنواع المحفوظة مع المستخدمة في الأجهزة (بدون أيقونات) */
export function collectDeviceTypeEntries(devices = []) {
  const map = new Map();

  loadCustomDeviceTypes().forEach((row) => {
    map.set(row.typeLabel.toLowerCase(), row);
  });

  (devices || []).forEach((device) => {
    const label = String(device?.typeLabel || "").trim();
    if (!label || isBuiltinDeviceTypeLabel(label)) return;
    const key = label.toLowerCase();
    if (map.has(key)) return;
    map.set(key, {
      type: device.type || slugifyDeviceType(label),
      typeLabel: label,
    });
  });

  return Array.from(map.values());
}
