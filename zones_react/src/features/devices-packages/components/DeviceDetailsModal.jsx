import { useEffect, useRef, useState } from "react";
import AdminModal from "./AdminModal";
import Button from "../../super-admin/components/ui/Button";
import { DeviceTypeCombobox } from "../../../components/ui/combobox";
import { DEVICE_TYPE_PREFIX,
  deviceNameMatchesType,
  suggestDeviceName,
  typeLabelFromType,
} from "../data/deviceNaming";
import { buildDeviceTypeOptions } from "../data/deviceTypeOptions";
import {
  CUSTOM_DEVICE_TYPES_EVENT,
  saveCustomDeviceType,
} from "../data/customDeviceTypesStorage";
import { getDevicePackageLabel } from "../data/devicesStorage";
import {
  DEVICE_SESSIONS_EVENT,
  getDeviceLastActivity,
  getDeviceSessionsThisMonth,
} from "../data/deviceSessionsStorage";
import { formatDisplayDate } from "../../maintenance/data/faultMeta";

const labelCls = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

const EMPTY_FORM = {
  name: "",
  type: "ps5",
  typeLabel: "PlayStation",
  packageId: "",
  isActive: true,
};

function ReadOnlyNotes({ value }) {
  return (
    <div className="min-h-[72px] rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200">
      {value?.trim() ? value : "—"}
    </div>
  );
}

function SystemDetailRow({ label, value, ltr }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 text-xs last:border-0 dark:border-gray-800">
      <span className="font-semibold text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className="rounded-lg bg-gray-100 px-2.5 py-1 font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        dir={ltr ? "ltr" : undefined}
        title="يُحسب تلقائياً — لا يمكن تعديله يدوياً"
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

const TITLES = {
  add: "إضافة جهاز جديد",
  edit: "تعديل الجهاز",
  details: "تفاصيل الجهاز",
};

export default function DeviceDetailsModal({
  open,
  mode = "details",
  device,
  packages = [],
  devices = [],
  onClose,
  onSave,
  lastMaintenance,
}) {
  const wasOpenRef = useRef(false);
  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const isFormMode = isAdd || isEdit;

  const [notes, setNotes] = useState("");
  const [sessionsCount, setSessionsCount] = useState(0);
  const [lastActivity, setLastActivity] = useState("—");
  const [form, setForm] = useState(EMPTY_FORM);
  const [typeOptions, setTypeOptions] = useState(() => buildDeviceTypeOptions(devices));

  useEffect(() => {
    if (open) setTypeOptions(buildDeviceTypeOptions(devices));
  }, [open, devices]);

  useEffect(() => {
    const refresh = () => setTypeOptions(buildDeviceTypeOptions(devices));
    window.addEventListener(CUSTOM_DEVICE_TYPES_EVENT, refresh);
    return () => window.removeEventListener(CUSTOM_DEVICE_TYPES_EVENT, refresh);
  }, [devices]);

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;

    if (!justOpened) return;

    if (isAdd) {
      setNotes("");
      setForm({
        ...EMPTY_FORM,
        name: suggestDeviceName(EMPTY_FORM.type, devices),
      });
      setSessionsCount(0);
      setLastActivity("—");
      return;
    }

    if (!device) return;
    setNotes(device.notes ?? "");
    setForm({
      name: device.name ?? "",
      type: device.type ?? "ps5",
      typeLabel: device.typeLabel || typeLabelFromType(device.type),
      packageId: device.packageId != null ? String(device.packageId) : "",
      isActive: device.isActive !== false,
    });
  }, [open, mode, device, isAdd, devices]);

  useEffect(() => {
    if (!open || isAdd || !device?.id) return;

    const refreshStats = () => {
      setSessionsCount(getDeviceSessionsThisMonth(device.id));
      setLastActivity(getDeviceLastActivity(device.id));
    };

    refreshStats();
    window.addEventListener(DEVICE_SESSIONS_EVENT, refreshStats);
    return () => window.removeEventListener(DEVICE_SESSIONS_EVENT, refreshStats);
  }, [open, device?.id, isAdd]);

  if (!open) return null;
  if (!isAdd && !device) return null;

  const onTypeResolved = ({ type, typeLabel }) => {
    setForm((f) => ({
      ...f,
      type,
      typeLabel,
      name: deviceNameMatchesType(f.name, type) ? f.name : suggestDeviceName(type, devices),
    }));
  };

  const onPersistType = ({ type, typeLabel }) => {
    saveCustomDeviceType({ type, typeLabel });
  };

  const packageOptions = packages.filter((p) => p.isActive !== false && !p.isArchived);

  const handleSave = () => {
    const typeLabel = form.typeLabel || typeLabelFromType(form.type);
    saveCustomDeviceType({ type: form.type, typeLabel });
    onSave?.({
      name: form.name.trim(),
      type: form.type,
      typeLabel,
      packageId: form.packageId ? Number(form.packageId) : null,
      isActive: isAdd ? true : device.isActive !== false,
      notes: notes.trim(),
    });
  };

  return (
    <AdminModal open={open} onClose={onClose} title={TITLES[mode] || TITLES.details} wide>
      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          {isFormMode ? (
            <div className="space-y-3">
              <div>
                <label className={labelCls} htmlFor="dm-name">
                  رقم الجهاز
                </label>
                <input
                  id="dm-name"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))}
                  placeholder={`مثال: ${DEVICE_TYPE_PREFIX[form.type] || "PS5"}-01`}
                  dir="ltr"
                  autoComplete="off"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  صيغة موحّدة: PS5-01، XBOX-02، PC-01، VR-01
                </p>
              </div>
              <div>
                <label className={labelCls}>نوع الجهاز</label>
                <DeviceTypeCombobox
                  type={form.type}
                  typeLabel={form.typeLabel}
                  options={typeOptions}
                  onTypeResolved={onTypeResolved}
                  onPersistType={onPersistType}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="dm-package">
                  الباقة التابعة
                </label>
                <select
                  id="dm-package"
                  className={inputCls}
                  value={form.packageId}
                  onChange={(e) => setForm((f) => ({ ...f, packageId: e.target.value }))}
                >
                  <option value="">— اختر باقة —</option>
                  {packageOptions.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                      {p.price ? ` (${p.price})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              <p className="text-base font-extrabold text-gray-900 dark:text-white" dir="ltr">
                {device.name}
              </p>
              <p className="mt-1 text-xs text-gray-500">{device.typeLabel}</p>
              <p className="mt-1 text-xs font-bold text-[#6B5478]">
                الباقة: {getDevicePackageLabel(device.packageId, packages)}
              </p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/40">
            <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300">بيانات النظام</p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              تُحسب وتُحدَّث تلقائياً عند الحفظ والحجوزات والصيانة — لا تُعدَّل يدوياً
            </p>
          </div>
          <div className="px-4 py-1">
            <SystemDetailRow
              label="تاريخ الإضافة"
              value={isAdd ? "يُسجَّل عند الحفظ" : formatDisplayDate(device.createdAt)}
              ltr={!isAdd}
            />
            <SystemDetailRow
              label="آخر صيانة"
              value={isAdd ? "—" : formatDisplayDate(lastMaintenance)}
              ltr
            />
            <SystemDetailRow
              label="عدد الجلسات هذا الشهر"
              value={isAdd ? "0 جلسة" : `${sessionsCount} جلسة`}
            />
            <SystemDetailRow
              label="تاريخ آخر نشاط"
              value={isAdd ? "—" : formatDisplayDate(lastActivity)}
              ltr
            />
            {!isAdd && device.isArchived ? (
              <SystemDetailRow label="تاريخ الأرشفة" value={formatDisplayDate(device.archivedAt)} ltr />
            ) : null}
          </div>
        </div>

        <div>
          <span className={labelCls}>ملاحظات المدير</span>
          {isFormMode ? (
            <textarea
              id="device-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isAdd && device.isArchived}
              placeholder="أضف ملاحظات عن هذا الجهاز..."
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          ) : (
            <ReadOnlyNotes value={device.notes} />
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {isFormMode ? (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                إلغاء
              </Button>
              <Button size="sm" onClick={handleSave}>
                {isAdd ? "حفظ الجهاز" : "حفظ"}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>
              إغلاق
            </Button>
          )}
        </div>
      </div>
    </AdminModal>
  );
}
