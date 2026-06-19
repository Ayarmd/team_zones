import { useEffect, useRef, useState } from "react";
import AdminModal from "./AdminModal";
import Button from "../../super-admin/components/ui/Button";
import {
  getPackageLastActivity,
  getPackageUsageThisMonth,
  PACKAGE_BOOKINGS_EVENT,
} from "../data/packageBookingsStorage";
import { formatDisplayDate } from "../../maintenance/data/faultMeta";

const labelCls = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

const EMPTY_FORM = {
  name: "",
  hours: "",
  price: "",
  deviceLabel: "",
  description: "",
  notes: "",
  isActive: true,
};

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

function ReadOnlyDetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2.5 text-xs last:border-0 dark:border-gray-800">
      <span className="shrink-0 font-semibold text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-left font-bold text-gray-800 dark:text-gray-100">{value || "—"}</span>
    </div>
  );
}

const TITLES = {
  add: "إضافة باقة جديدة",
  edit: "تعديل الباقة",
  details: "تفاصيل الباقة",
};

export default function PackageDetailsModal({
  open,
  mode = "details",
  pkg,
  onClose,
  onSave,
}) {
  const wasOpenRef = useRef(false);
  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const isDetails = mode === "details";
  const isFormMode = isAdd || isEdit;

  const [form, setForm] = useState(EMPTY_FORM);
  const [usageCount, setUsageCount] = useState(0);
  const [lastActivity, setLastActivity] = useState("—");

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;

    if (isAdd) {
      setForm({ ...EMPTY_FORM });
      setUsageCount(0);
      setLastActivity("—");
      return;
    }
    if (!pkg) return;
    setForm({
      name: pkg.name ?? "",
      hours: pkg.hours ?? "",
      price: pkg.price ?? "",
      deviceLabel: pkg.deviceLabel ?? "",
      description: pkg.description ?? "",
      notes: pkg.notes ?? "",
      isActive: pkg.isActive !== false,
    });
  }, [open, mode, pkg, isAdd]);

  useEffect(() => {
    if (!open || isAdd || !pkg?.id) return;

    const refreshStats = () => {
      setUsageCount(getPackageUsageThisMonth(pkg.id));
      setLastActivity(getPackageLastActivity(pkg.id));
    };

    refreshStats();
    window.addEventListener(PACKAGE_BOOKINGS_EVENT, refreshStats);
    return () => window.removeEventListener(PACKAGE_BOOKINGS_EVENT, refreshStats);
  }, [open, pkg?.id, isAdd]);

  if (!open) return null;
  if (!isAdd && !pkg) return null;

  const handleSave = () => {
    onSave?.({
      name: form.name.trim(),
      hours: form.hours.trim(),
      price: form.price.trim(),
      deviceLabel: form.deviceLabel.trim(),
      description: form.description.trim(),
      notes: form.notes.trim(),
      isActive: isAdd ? true : pkg.isActive !== false,
    });
  };

  const activeState = isAdd ? true : (isEdit ? pkg.isActive !== false : pkg.isActive);

  return (
    <AdminModal open={open} onClose={onClose} title={TITLES[mode] || TITLES.details} wide>
      <div className="mt-4 space-y-4">
        {/* ——— عرض التفاصيل: للقراءة فقط ——— */}
        {isDetails ? (
          <>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
              <p className="text-base font-extrabold text-gray-900 dark:text-white">{pkg.name}</p>
              <p className="mt-2 text-lg font-extrabold text-[#6B5478]">{pkg.price}</p>
            </div>

            <div className="rounded-xl border border-gray-100 px-4 py-1 dark:border-gray-800">
              <ReadOnlyDetailRow label="المدة" value={pkg.hours} />
              <ReadOnlyDetailRow label="السعر" value={pkg.price} />
              <ReadOnlyDetailRow label="جهاز مستخدم" value={pkg.deviceLabel} />
              <ReadOnlyDetailRow label="وصف مختصر" value={pkg.description} />
              <ReadOnlyDetailRow label="ملاحظة" value={pkg.notes} />
            </div>
          </>
        ) : null}

        {/* ——— إضافة / تعديل: حقول قابلة للتعديل ——— */}
        {isFormMode ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="pk-name">
                  اسم الباقة
                </label>
                <input
                  id="pk-name"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="pk-hours">
                  المدة
                </label>
                <input
                  id="pk-hours"
                  className={inputCls}
                  value={form.hours}
                  onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                  placeholder="مثال: 3 ساعات"
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="pk-price">
                  السعر
                </label>
                <input
                  id="pk-price"
                  className={inputCls}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="مثال: 55 د.ل"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="pk-device">
                  جهاز مستخدم
                </label>
                <input
                  id="pk-device"
                  className={inputCls}
                  value={form.deviceLabel}
                  onChange={(e) => setForm((f) => ({ ...f, deviceLabel: e.target.value }))}
                  placeholder="مثال: PlayStation 5"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="pk-desc">
                  وصف مختصر للباقة
                </label>
                <textarea
                  id="pk-desc"
                  rows={2}
                  className={`${inputCls} resize-none`}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="pk-notes">
                  ملاحظة
                </label>
                <textarea
                  id="pk-notes"
                  rows={2}
                  className={`${inputCls} resize-none`}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* ——— بيانات النظام — للعرض فقط ——— */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/40">
            <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300">بيانات النظام</p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              تُحسب تلقائياً من الحجوزات — لا تُعدَّل يدوياً
            </p>
          </div>
          <div className="px-4 py-1">
            <SystemDetailRow
              label="تاريخ الإضافة"
              value={isAdd ? "يُسجَّل عند الحفظ" : formatDisplayDate(pkg?.createdAt)}
              ltr={!isAdd}
            />
            <SystemDetailRow
              label="عدد الاستخدام هذا الشهر"
              value={isAdd ? "0 مرة" : `${usageCount} مرة`}
            />
            <SystemDetailRow
              label="تاريخ آخر نشاط"
              value={isAdd ? "—" : lastActivity}
              ltr
            />
          </div>
        </div>

        {isDetails ? (
          <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-xs dark:border-gray-800">
            <span className="font-semibold text-gray-500 dark:text-gray-400">حالة الباقة</span>
            <span
              className={`rounded-full px-2.5 py-0.5 font-bold ${
                activeState
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/15 text-red-600 dark:text-red-400"
              }`}
            >
              {activeState ? "مفعّلة" : "معطّلة"}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          {isFormMode ? (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                إلغاء
              </Button>
              <Button size="sm" onClick={handleSave}>
                {isAdd ? "حفظ الباقة" : "حفظ"}
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
