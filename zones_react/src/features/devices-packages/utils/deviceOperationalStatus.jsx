import { isDeviceBroken } from "./deviceFaultSync";

/** حالة تشغيل الجهاز للعرض في لوحات الاستقبال — مربوطة ببيانات المدير والصيانة */
export function getDeviceOperationalStatus(device) {
  if (!device) return { key: "broken", label: "معطّل" };
  if (device.maintenanceInProgress) {
    return { key: "maintenance", label: "تحت صيانة" };
  }
  if (isDeviceBroken(device)) {
    return { key: "broken", label: "معطّل" };
  }
  if (device.isActive !== false) {
    return { key: "active", label: "مفعّل" };
  }
  return { key: "broken", label: "معطّل" };
}

export const OPERATIONAL_STATUS_BADGE = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  broken: "bg-red-500/15 text-red-600 dark:text-red-400",
  maintenance: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

export function DeviceOperationalStatusBadge({ device }) {
  const status = getDeviceOperationalStatus(device);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${OPERATIONAL_STATUS_BADGE[status.key] || OPERATIONAL_STATUS_BADGE.broken}`}
    >
      {status.label}
    </span>
  );
}
