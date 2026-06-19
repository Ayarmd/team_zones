import { loadFaults } from "../../maintenance/data/maintenanceFaultsStorage";
import { formatDisplayDate } from "../../maintenance/data/faultMeta";

/** آخر صيانة مُنجزة للجهاز من سجل الأعطال */
export function getDeviceLastMaintenance(deviceId) {
  const faults = loadFaults().filter(
    (f) => f.deviceId === deviceId && !f.archived && f.status === "resolved",
  );
  if (!faults.length) return "—";
  const latest = faults.reduce((a, b) => ((a.id ?? 0) > (b.id ?? 0) ? a : b));
  return formatDisplayDate(latest.resolvedAt || latest.createdAt);
}
