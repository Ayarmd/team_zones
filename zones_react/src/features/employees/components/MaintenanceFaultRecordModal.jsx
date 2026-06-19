import { useCallback, useEffect, useMemo, useState } from "react";
import AdminModal from "../../devices-packages/components/AdminModal";
import Button from "../../super-admin/components/ui/Button";
import { DEVICES_STORAGE_EVENT } from "../../devices-packages/data/devicesStorage";
import { useDevicesStorageSync } from "../../devices-packages/hooks/useDevicesStorageSync";
import {
  loadSelectableDevicesForFault,
  loadSyncedActiveDevices,
} from "../../devices-packages/utils/deviceFaultSync";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import {
  FAULT_TYPES,
  formatFaultDateTime,
  isFaultDateValidForDevice,
  minFaultDateInputValue,
  toDateInputValue,
} from "../../maintenance/data/faultMeta";
import {
  getLatestPendingFaultForDevice,
  loadFaults,
  MAINTENANCE_FAULTS_EVENT,
  nextFaultId,
} from "../../maintenance/data/maintenanceFaultsStorage";
import { zonesToastError } from "../../../shared/utils/zonesAlerts";
import DeviceNameCell from "./DeviceNameCell";

const labelCls = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";
const fieldWrap = "rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/40";
const formGrid = "grid grid-cols-1 gap-3 sm:grid-cols-2";

export default function MaintenanceFaultRecordModal({
  open,
  onClose,
  onSave,
  prefilledDeviceId = null,
}) {
  const session = getAuthSession();
  const lockDevice = prefilledDeviceId != null;
  const [devicesTick, setDevicesTick] = useState(0);

  const refreshDevices = useCallback(() => setDevicesTick((t) => t + 1), []);

  const selectableDevices = useMemo(
    () => (open ? loadSelectableDevicesForFault() : []),
    [open, devicesTick],
  );
  const allDevices = useMemo(
    () => (open ? loadSyncedActiveDevices() : []),
    [open, devicesTick],
  );

  const previewId = useMemo(() => nextFaultId(loadFaults()), [open, devicesTick]);

  const [deviceId, setDeviceId] = useState("");
  const [faultType, setFaultType] = useState("screen");
  const [customFaultType, setCustomFaultType] = useState("");
  const [createdDate, setCreatedDate] = useState(toDateInputValue());
  const [details, setDetails] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (!open) return;
    refreshDevices();
    window.addEventListener(DEVICES_STORAGE_EVENT, refreshDevices);
    window.addEventListener(MAINTENANCE_FAULTS_EVENT, refreshDevices);
    return () => {
      window.removeEventListener(DEVICES_STORAGE_EVENT, refreshDevices);
      window.removeEventListener(MAINTENANCE_FAULTS_EVENT, refreshDevices);
    };
  }, [open, refreshDevices]);

  useDevicesStorageSync(refreshDevices);

  useEffect(() => {
    if (!open) return;
    const enabledList = loadSelectableDevicesForFault();
    const syncedList = loadSyncedActiveDevices();
    const preferred = lockDevice
      ? syncedList.find((d) => String(d.id) === String(prefilledDeviceId))
      : enabledList[0];
    setDeviceId(preferred ? String(preferred.id) : "");
    setFaultType("screen");
    setCustomFaultType("");
    setCreatedDate(toDateInputValue());
    setDetails("");
    setDateError("");
  }, [open, lockDevice, prefilledDeviceId, devicesTick]);

  const selectedDevice = useMemo(() => {
    if (lockDevice) {
      return allDevices.find((d) => String(d.id) === String(prefilledDeviceId)) ?? null;
    }
    return selectableDevices.find((d) => String(d.id) === String(deviceId)) ?? null;
  }, [allDevices, selectableDevices, deviceId, lockDevice, prefilledDeviceId]);

  const submit = (e) => {
    e.preventDefault();
    if (!selectedDevice) {
      zonesToastError("اختر جهازاً من أجهزة الصالة.", "لا يوجد جهاز");
      return;
    }
    if (getLatestPendingFaultForDevice(selectedDevice.id)) {
      zonesToastError("هذا الجهاز له عطل معلّق بالفعل — أصلِحه أولاً.", "عطل موجود");
      return;
    }
    if (faultType === "other" && !customFaultType.trim()) return;
    if (!isFaultDateValidForDevice(selectedDevice, createdDate)) {
      setDateError("تاريخ العطل لا يمكن أن يسبق تاريخ إضافة الجهاز.");
      return;
    }
    setDateError("");

    onSave?.({
      deviceId: selectedDevice.id,
      deviceName: selectedDevice.name,
      deviceType: selectedDevice.type,
      deviceTypeLabel: selectedDevice.typeLabel,
      faultType,
      faultTypeCustom: faultType === "other" ? customFaultType.trim() : "",
      status: "pending",
      createdAt: formatFaultDateTime(new Date(`${createdDate}T12:00:00`)),
      maintenanceCost: 0,
      maintenanceEmployeeName: session?.fullName || "موظف الصيانة",
      details: details.trim(),
      resolvedAt: "",
    });
  };

  const modalTitle = lockDevice ? "تبليغ عن عطل" : "إضافة عطل";

  return (
    <AdminModal open={open} onClose={onClose} title={modalTitle} wide>
      <form onSubmit={submit} className="mt-4 space-y-4" dir="rtl">
        <div className={formGrid}>
          <div className={fieldWrap}>
            <label className={labelCls}>رقم السجل</label>
            <input className={inputCls} type="text" value={previewId} readOnly dir="ltr" />
          </div>

          <div className={fieldWrap}>
            <label className={labelCls}>
              الجهاز <span className="text-red-500">*</span>
            </label>
            {lockDevice && selectedDevice ? (
              <DeviceNameCell device={selectedDevice} />
            ) : (
              <>
                <select
                  id="fault-device-name"
                  className={inputCls}
                  required
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  onFocus={refreshDevices}
                  onMouseDown={refreshDevices}
                >
                  <option value="">اختر أجهزة الصالة</option>
                  {selectableDevices.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name} — {d.typeLabel}
                    </option>
                  ))}
                </select>
                {selectableDevices.length === 0 ? (
                  <p className="mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    لا توجد أجهزة متاحة لتسجيل عطل حالياً.
                  </p>
                ) : null}
              </>
            )}
          </div>

          <div className={fieldWrap}>
            <label htmlFor="fault-type" className={labelCls}>
              نوع العطل <span className="text-red-500">*</span>
            </label>
            <select
              id="fault-type"
              className={inputCls}
              value={faultType}
              onChange={(e) => {
                setFaultType(e.target.value);
                if (e.target.value !== "other") setCustomFaultType("");
              }}
            >
              {FAULT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {faultType === "other" ? (
            <div className={fieldWrap}>
              <label htmlFor="fault-type-custom" className={labelCls}>
                وصف العطل <span className="text-red-500">*</span>
              </label>
              <input
                id="fault-type-custom"
                className={inputCls}
                type="text"
                value={customFaultType}
                onChange={(e) => setCustomFaultType(e.target.value)}
                required
              />
            </div>
          ) : null}

          <div className={fieldWrap}>
            <label htmlFor="fault-date" className={labelCls}>
              تاريخ العطل <span className="text-red-500">*</span>
            </label>
            <input
              id="fault-date"
              className={inputCls}
              type="date"
              dir="ltr"
              required
              value={createdDate}
              min={minFaultDateInputValue(selectedDevice)}
              onChange={(e) => {
                setCreatedDate(e.target.value);
                setDateError("");
              }}
            />
            {dateError ? <p className="mt-1 text-[10px] font-bold text-red-500">{dateError}</p> : null}
          </div>

          <div className={fieldWrap}>
            <label className={labelCls}>الحالة بعد الحفظ</label>
            <span className="inline-flex rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:text-red-400">
              معطل
            </span>
          </div>
        </div>

        <div className={fieldWrap}>
          <label htmlFor="fault-details" className={labelCls}>
            ملاحظات (اختياري)
          </label>
          <textarea
            id="fault-details"
            rows={2}
            className={`${inputCls} resize-none`}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="تفاصيل إضافية عن العطل..."
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" size="sm" disabled={!selectedDevice}>
            {lockDevice ? "حفظ التبليغ" : "حفظ وإظهار في الجدول"}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
