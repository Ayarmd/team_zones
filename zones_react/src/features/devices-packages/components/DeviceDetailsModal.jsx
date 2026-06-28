import { useEffect, useRef, useState } from "react";

import AdminModal from "./AdminModal";

import Button from "../../super-admin/components/ui/Button";

import DeviceTypeSelect from "./DeviceTypeSelect";

import { DEVICE_TYPE_PREFIX, suggestDeviceName, typeLabelFromType } from "../data/deviceNaming";

import { getDeviceTypePrefix } from "../data/deviceTypesConfig";

import {

  isDuplicateDeviceIdentifier,

  sanitizeDeviceIdentifierInput,

} from "../data/deviceValidation";

import { resolveCanonicalDeviceType } from "../data/deviceTypeOptions";

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

  typeLabel: "PlayStation 5",

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

  const devicesRef = useRef(devices);

  const nameTouchedRef = useRef(false);

  const isAdd = mode === "add";

  const isEdit = mode === "edit";

  const isFormMode = isAdd || isEdit;



  const [notes, setNotes] = useState("");

  const [sessionsCount, setSessionsCount] = useState(0);

  const [lastActivity, setLastActivity] = useState("—");

  const [form, setForm] = useState(EMPTY_FORM);

  const [nameError, setNameError] = useState("");



  devicesRef.current = devices;



  const excludeDeviceId = isEdit ? device?.id : null;



  const validateDeviceName = (rawName, deviceList = devicesRef.current) => {

    const trimmed = String(rawName ?? "").trim();

    if (!trimmed) {

      setNameError("");

      return true;

    }

    if (isDuplicateDeviceIdentifier(trimmed, deviceList, excludeDeviceId)) {

      setNameError(`الجهاز «${trimmed}» موجود مسبقاً. اختر اسماً آخر.`);

      return false;

    }

    setNameError("");

    return true;

  };



  useEffect(() => {

    const justOpened = open && !wasOpenRef.current;

    wasOpenRef.current = open;



    if (!justOpened) return;



    nameTouchedRef.current = false;



    if (isAdd) {

      setNotes("");

      setNameError("");

      setForm({

        ...EMPTY_FORM,

        name: suggestDeviceName(EMPTY_FORM.type, devicesRef.current),

      });

      setSessionsCount(0);

      setLastActivity("—");

      return;

    }



    if (!device) return;

    const canonical = resolveCanonicalDeviceType(device.type, device.typeLabel);

    setNotes(device.notes ?? "");

    setNameError("");

    setForm({

      name: device.name ?? "",

      type: canonical.type,

      typeLabel: canonical.typeLabel,

      packageId: device.packageId != null ? String(device.packageId) : "",

      isActive: device.isActive !== false,

    });

  }, [open, mode, device, isAdd]);



  useEffect(() => {

    if (!open || isAdd || !device?.id) return;



    const refreshStats = () => {

      setSessionsCount(getDeviceSessionsThisMonth(device.id, device));

      setLastActivity(getDeviceLastActivity(device.id, device));

    };



    refreshStats();

    window.addEventListener(DEVICE_SESSIONS_EVENT, refreshStats);

    return () => window.removeEventListener(DEVICE_SESSIONS_EVENT, refreshStats);

  }, [open, device?.id, isAdd]);



  if (!open) return null;

  if (!isAdd && !device) return null;



  const onTypeChange = (nextType) => {

    const typeLabel = typeLabelFromType(nextType);

    setForm((f) => ({

      ...f,

      type: nextType,

      typeLabel,

    }));

  };



  const packageOptions = packages.filter((p) => p.isActive !== false && !p.isArchived);



  const handleSave = () => {

    if (isAdd && !form.packageId) {

      return;

    }



    const trimmedName = form.name.trim();

    if (!trimmedName) {

      setNameError("أدخل رقم الجهاز أو اسمه.");

      return;

    }



    if (!validateDeviceName(trimmedName)) {

      return;

    }



    const typeLabel = form.typeLabel || typeLabelFromType(form.type);

    onSave?.({

      name: trimmedName,

      type: form.type,

      typeLabel,

      packageId: form.packageId ? Number(form.packageId) : null,

      isActive: isAdd ? true : device.isActive !== false,

      notes: notes.trim(),

    });

  };



  const onNameChange = (value) => {

    nameTouchedRef.current = true;

    const next = sanitizeDeviceIdentifierInput(value);

    setForm((f) => ({ ...f, name: next }));

    validateDeviceName(next);

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

                  className={`${inputCls}${nameError ? " border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}

                  value={form.name}

                  onChange={(e) => onNameChange(e.target.value)}

                  onBlur={() => validateDeviceName(form.name)}

                  placeholder={`مثال: ${getDeviceTypePrefix(form.type) || DEVICE_TYPE_PREFIX.ps5 || "PS5"}-01`}

                  dir="ltr"

                  autoComplete="off"

                  aria-invalid={nameError ? "true" : undefined}

                  aria-describedby={nameError ? "dm-name-error" : "dm-name-hint"}

                />

                {nameError ? (

                  <p id="dm-name-error" className="mt-1 text-[10px] font-semibold text-red-500">

                    {nameError}

                  </p>

                ) : (

                  <p id="dm-name-hint" className="mt-1 text-[10px] text-gray-400">

                    صيغة موحّدة: PS5-01، XBOX-02، PC-01، VR-01

                  </p>

                )}

              </div>

              <div>

                <label className={labelCls} htmlFor="dm-type">

                  نوع الجهاز

                </label>

                <DeviceTypeSelect

                  value={form.type}

                  onChange={onTypeChange}

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

                  required={isAdd}

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

              <Button size="sm" onClick={handleSave} disabled={Boolean(nameError)}>

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


