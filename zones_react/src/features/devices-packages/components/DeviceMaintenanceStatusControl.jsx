import { zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import { isDeviceBroken, isDeviceRepairInProgress } from "../utils/deviceFaultSync";
import {
  markDeviceMaintenanceFromManager,
  tryEnableDevice,
} from "../../maintenance/utils/maintenanceWorkflow";

export default function DeviceMaintenanceStatusControl({
  device,
  managerName = "مدير الصالة",
  onChanged,
}) {
  if (!device) return null;

  const managerDisabled = device.isActive === false;
  const broken = isDeviceBroken(device);
  const outOfService = broken || managerDisabled;
  const inProgress = isDeviceRepairInProgress(device);

  const handleClick = () => {
    if (inProgress) return;

    if (outOfService) {
      if (tryEnableDevice(device.id)) {
        zonesToastSuccess("الجهاز سليم الآن");
        onChanged?.();
      }
      return;
    }

    if (markDeviceMaintenanceFromManager(device, managerName)) {
      zonesToastSuccess("تم تسجيل الجهاز في الصيانة — يظهر لموظف الصيانة");
      onChanged?.();
    }
  };

  const label = inProgress ? "قيد الإصلاح" : outOfService ? "معطل" : "سليم";
  const toneClass = inProgress
    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    : outOfService
      ? "bg-red-500/15 text-red-600 dark:text-red-400"
      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";

  if (managerDisabled && !broken && !inProgress) {
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${toneClass}`}
        title="معطل — يُزامَن مع الصيانة تلقائياً"
      >
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={inProgress}
      title={
        inProgress
          ? "قيد الإصلاح — يُحدَّث من موظف الصيانة"
          : outOfService
            ? "اضغط لإرجاع الجهاز إلى سليم (بعد إصلاح الصيانة)"
            : "اضغط لتسجيل الجهاز في الصيانة"
      }
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${toneClass} ${
        inProgress ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-85"
      }`}
    >
      {label}
    </button>
  );
}
