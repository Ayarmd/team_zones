import { zonesToastError, zonesToastWarning } from "../../../shared/utils/zonesAlerts";
import { loadDevices, endDeviceMaintenance, setMaintenanceDeviceStatus } from "../../devices-packages/data/devicesStorage";
import { reconcileDevicesWithFaults } from "../../devices-packages/utils/deviceFaultSync";
import {
  addFault,
  getLatestPendingFaultForDevice,
  resolveAndArchiveFaultForDevice,
} from "../data/maintenanceFaultsStorage";
import { formatFaultDateTime } from "../data/faultMeta";

/** هل يُقفَل مفتاح التفعيل (عطل معلّق أو صيانة جارية) */
export function isDeviceToggleLocked(device) {
  if (!device) return true;
  return Boolean(getLatestPendingFaultForDevice(device.id)) || Boolean(device.maintenanceInProgress);
}

/** تسجيل عطل + تعطيل الجهاز → يظهر في «الأعطال الحالية» */
export function reportDeviceFault(payload) {
  addFault(payload);
  setMaintenanceDeviceStatus(payload.deviceId, false, { hasPendingFault: true });
  reconcileDevicesWithFaults();
}

function registerManagerFault(device, managerName, faultTypeCustom) {
  if (!device?.id) return false;
  if (getLatestPendingFaultForDevice(device.id)) {
    zonesToastWarning("الجهاز مسجّل في الصيانة بالفعل.");
    return false;
  }
  addFault({
    deviceId: device.id,
    deviceName: device.name,
    deviceType: device.type,
    deviceTypeLabel: device.typeLabel,
    faultType: "other",
    faultTypeCustom,
    status: "pending",
    createdAt: formatFaultDateTime(),
    maintenanceCost: 0,
    maintenanceEmployeeName: managerName,
    details: "",
    resolvedAt: "",
  });
  setMaintenanceDeviceStatus(device.id, false, { hasPendingFault: true });
  reconcileDevicesWithFaults();
  return true;
}

/** المدير يعطّل الجهاز من الإجراءات — يُنشئ عطلاً نشطاً لموظف الصيانة */
export function disableDeviceFromManager(device, managerName = "مدير الصالة") {
  return registerManagerFault(device, managerName, "تعطيل من المدير");
}

/** المدير يضع الجهاز في الصيانة — يظهر عند موظف الصيانة */
export function markDeviceMaintenanceFromManager(device, managerName = "مدير الصالة") {
  return registerManagerFault(device, managerName, "طلب صيانة من المدير");
}

/** أجهزة معطّلة بلا سجل عطل — مزامنة تلقائية بين المدير والصيانة */
export function reconcileDisabledDevicesWithoutFaults(managerName = "مدير الصالة") {
  const orphans = loadDevices().filter(
    (d) => !d.isArchived && d.isActive === false && !getLatestPendingFaultForDevice(d.id),
  );
  if (!orphans.length) return 0;

  for (const device of orphans) {
    registerManagerFault(device, managerName, "تعطيل من المدير");
  }
  return orphans.length;
}

/** إتمام الإصلاح — أرشفة العطل + تنظيف حالة الجهاز */
export function completeDeviceRepair(deviceId, maintenanceCost = 0) {
  resolveAndArchiveFaultForDevice(deviceId, maintenanceCost);
  endDeviceMaintenance(deviceId);
  reconcileDevicesWithFaults();
}

/** إعادة تفعيل — مسموح فقط بعد إتمام الإصلاح من جدول الأعطال */
export function tryEnableDevice(deviceId) {
  if (getLatestPendingFaultForDevice(deviceId)) {
    zonesToastError("أكمل الإصلاح من لوحة موظف الصيانة — يُفعَّل الجهاز تلقائياً بعد «تم الإصلاح».");
    return false;
  }
  setMaintenanceDeviceStatus(deviceId, true);
  reconcileDevicesWithFaults();
  return true;
}
