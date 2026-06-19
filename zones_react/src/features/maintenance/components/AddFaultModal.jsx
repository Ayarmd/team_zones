import { useEffect, useMemo, useState } from "react";
import { loadSelectableDevicesForFault } from "../../devices-packages/utils/deviceFaultSync";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import { FAULT_STATUSES, FAULT_TYPES, formatFaultDateTime, toDateInputValue } from "../data/faultMeta";
import { nextFaultId, loadFaults } from "../data/maintenanceFaultsStorage";
import MaintenanceGlassModal from "./MaintenanceGlassModal";

const fieldClass =
  "zones-modal-field w-full rounded-xl border px-3 py-2 text-[12px] outline-none transition focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/30";
const labelClass = "zones-modal-label mb-1 block text-end text-[12px] font-bold";

export default function AddFaultModal({ isOpen, onClose, onSave, preselectedDeviceId }) {
  const session = getAuthSession();
  const devices = useMemo(() => loadSelectableDevicesForFault(), [isOpen]);
  const previewId = useMemo(() => nextFaultId(loadFaults()), [isOpen]);

  const [deviceId, setDeviceId] = useState("");
  const [faultType, setFaultType] = useState("screen");
  const [customFaultType, setCustomFaultType] = useState("");
  const [status, setStatus] = useState("pending");
  const [details, setDetails] = useState("");
  const [createdDate, setCreatedDate] = useState(toDateInputValue());
  const [maintenanceCost, setMaintenanceCost] = useState("");
  const [employeeName, setEmployeeName] = useState(session?.fullName || "");

  useEffect(() => {
    if (!isOpen) return;
    setDeviceId(preselectedDeviceId ? String(preselectedDeviceId) : devices[0] ? String(devices[0].id) : "");
    setFaultType("screen");
    setCustomFaultType("");
    setStatus("pending");
    setDetails("");
    setCreatedDate(toDateInputValue());
    setMaintenanceCost("");
    setEmployeeName(session?.fullName || "");
  }, [isOpen, preselectedDeviceId, devices, session?.fullName]);

  const submit = (e) => {
    e.preventDefault();
    const device = devices.find((d) => String(d.id) === String(deviceId));
    if (!device) return;

    if (faultType === "other" && !customFaultType.trim()) {
      return;
    }

    const createdAt = formatFaultDateTime(new Date(`${createdDate}T12:00:00`));
    onSave({
      deviceId: device.id,
      deviceName: device.name,
      faultType,
      faultTypeCustom: faultType === "other" ? customFaultType.trim() : "",
      status,
      details: details.trim(),
      createdAt,
      maintenanceCost: Number(maintenanceCost) || 0,
      maintenanceEmployeeName: employeeName.trim() || session?.fullName || "موظف الصيانة",
    });
    onClose();
  };

  const footer = (
    <>
      <button type="button" className="ghost-link maint-modal__btn" onClick={onClose}>
        إلغاء
      </button>
      <button type="submit" form="add-fault-form" className="primary-btn maint-modal__btn">
        حفظ السجل
      </button>
    </>
  );

  return (
    <MaintenanceGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="إضافة سجل عطل"
      wide
      noScroll
      footer={footer}
    >
      <form id="add-fault-form" className="maint-add-grid" onSubmit={submit}>
        <div className="maint-add-grid__full">
          <label className={labelClass}>رقم العطل</label>
          <input className={fieldClass} type="text" value={previewId} readOnly dir="ltr" aria-readonly />
        </div>

        <div className="maint-add-grid__full">
          <label className={labelClass} htmlFor="fault-device">
            جهاز الصالة
          </label>
          <select
            id="fault-device"
            className={fieldClass}
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            required
          >
            {devices.length === 0 ? (
              <option value="">لا توجد أجهزة — أضفها من واجهة المدير</option>
            ) : (
              devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.typeLabel}
                </option>
              ))
            )}
          </select>
        </div>

        <div className={faultType === "other" ? "maint-add-grid__full" : ""}>
          <label className={labelClass} htmlFor="fault-type">
            نوع العطل
          </label>
          <select
            id="fault-type"
            className={fieldClass}
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
          {faultType === "other" ? (
            <input
              id="fault-type-custom"
              className={`${fieldClass} mt-2`}
              type="text"
              value={customFaultType}
              onChange={(e) => setCustomFaultType(e.target.value)}
              placeholder="اكتب نوع العطل..."
              required
            />
          ) : null}
        </div>

        <div>
          <label className={labelClass} htmlFor="fault-status">
            الحالة
          </label>
          <select
            id="fault-status"
            className={fieldClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {FAULT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="maint-add-grid__full">
          <label className={labelClass} htmlFor="fault-details">
            تفاصيل العطل
          </label>
          <textarea
            id="fault-details"
            className={`${fieldClass} maint-add-textarea`}
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="اكتب وصف العطل والملاحظات..."
            required
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="fault-date">
            تاريخ الإنشاء
          </label>
          <input
            id="fault-date"
            className={fieldClass}
            type="date"
            dir="ltr"
            value={createdDate}
            onChange={(e) => setCreatedDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="fault-cost">
            تكلفة الصيانة
          </label>
          <input
            id="fault-cost"
            className={fieldClass}
            type="number"
            min="0"
            step="0.01"
            dir="ltr"
            placeholder="0"
            value={maintenanceCost}
            onChange={(e) => setMaintenanceCost(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="fault-employee">
            اسم موظف الصيانة
          </label>
          <input
            id="fault-employee"
            className={fieldClass}
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            required
          />
        </div>
      </form>
    </MaintenanceGlassModal>
  );
}
