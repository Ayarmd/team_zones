import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import Button from "../../super-admin/components/ui/Button";
import { loadSelectableDevicesForFault } from "../../devices-packages/utils/deviceFaultSync";
import { setDeviceFault } from "../../devices-packages/data/devicesStorage";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import { FAULT_STATUSES, FAULT_TYPES, formatFaultDateTime, toDateInputValue } from "../../maintenance/data/faultMeta";
import { addFault, nextFaultId, loadFaults } from "../../maintenance/data/maintenanceFaultsStorage";
import { MAINTENANCE_EMPLOYEE_ROUTES } from "../data/maintenanceEmployeeRoutes";

const labelCls = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";
const fieldWrap = "rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/40";
const formGrid = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";

export default function MaintenanceRegisterFaultPage() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const devices = useMemo(() => loadSelectableDevicesForFault(), []);
  const previewId = useMemo(() => nextFaultId(loadFaults()), []);

  const [deviceId, setDeviceId] = useState(devices[0] ? String(devices[0].id) : "");
  const [faultType, setFaultType] = useState("screen");
  const [customFaultType, setCustomFaultType] = useState("");
  const [status, setStatus] = useState("pending");
  const [details, setDetails] = useState("");
  const [createdDate, setCreatedDate] = useState(toDateInputValue());
  const [maintenanceCost, setMaintenanceCost] = useState("");
  const [employeeName, setEmployeeName] = useState(session?.fullName || "");

  const submit = async (e) => {
    e.preventDefault();
    const device = devices.find((d) => String(d.id) === String(deviceId));
    if (!device) return;
    if (faultType === "other" && !customFaultType.trim()) return;

    addFault({
      deviceId: device.id,
      deviceName: device.name,
      faultType,
      faultTypeCustom: faultType === "other" ? customFaultType.trim() : "",
      status,
      details: details.trim(),
      createdAt: formatFaultDateTime(new Date(`${createdDate}T12:00:00`)),
      maintenanceCost: Number(maintenanceCost) || 0,
      maintenanceEmployeeName: employeeName.trim() || session?.fullName || "موظف الصيانة",
    });

    if (status === "pending") {
      setDeviceFault(device.id, true);
    }

    zonesToastSuccess("تم حفظ سجل العطل بنجاح.", "تم التسجيل");
    navigate(MAINTENANCE_EMPLOYEE_ROUTES.faults);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <PageHeader title="إضافة عطل" description="إضافة سجل عطل جديد لجهاز في الصالة." />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={submit} className="space-y-4">
          <div className={formGrid}>
            <div className={fieldWrap}>
              <label className={labelCls}>رقم العطل</label>
              <input className={inputCls} type="text" value={previewId} readOnly dir="ltr" />
            </div>

            <div className={`${fieldWrap} sm:col-span-2`}>
              <label htmlFor="fault-device" className={labelCls}>
                جهاز الصالة <span className="text-red-500">*</span>
              </label>
              <select
                id="fault-device"
                className={inputCls}
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                required
              >
                {devices.length === 0 ? (
                  <option value="">لا توجد أجهزة</option>
                ) : (
                  devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.typeLabel}
                    </option>
                  ))
                )}
              </select>
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
                  نوع العطل (مخصص) <span className="text-red-500">*</span>
                </label>
                <input
                  id="fault-type-custom"
                  className={inputCls}
                  type="text"
                  value={customFaultType}
                  onChange={(e) => setCustomFaultType(e.target.value)}
                  placeholder="اكتب نوع العطل..."
                  required
                />
              </div>
            ) : null}

            <div className={fieldWrap}>
              <label htmlFor="fault-status" className={labelCls}>
                الحالة
              </label>
              <select
                id="fault-status"
                className={inputCls}
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

            <div className={fieldWrap}>
              <label htmlFor="fault-date" className={labelCls}>
                تاريخ الإنشاء
              </label>
              <input
                id="fault-date"
                className={inputCls}
                type="date"
                dir="ltr"
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
                required
              />
            </div>

            <div className={fieldWrap}>
              <label htmlFor="fault-cost" className={labelCls}>
                تكلفة الصيانة
              </label>
              <input
                id="fault-cost"
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                dir="ltr"
                placeholder="0"
                value={maintenanceCost}
                onChange={(e) => setMaintenanceCost(e.target.value)}
              />
            </div>

            <div className={fieldWrap}>
              <label htmlFor="fault-employee" className={labelCls}>
                اسم موظف الصيانة
              </label>
              <input
                id="fault-employee"
                className={inputCls}
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={fieldWrap}>
            <label htmlFor="fault-details" className={labelCls}>
              تفاصيل العطل <span className="text-red-500">*</span>
            </label>
            <textarea
              id="fault-details"
              className={`${inputCls} min-h-[90px] resize-y`}
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="اكتب وصف العطل والملاحظات..."
              required
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(MAINTENANCE_EMPLOYEE_ROUTES.faults)}>
              إلغاء
            </Button>
            <Button type="submit" size="sm">
              حفظ السجل
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
