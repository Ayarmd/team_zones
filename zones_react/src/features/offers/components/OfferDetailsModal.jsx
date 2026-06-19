import { useEffect, useMemo, useRef, useState } from "react";
import AdminModal from "../../devices-packages/components/AdminModal";
import DeviceStatusToggle from "../../devices-packages/components/DeviceStatusToggle";
import Button from "../../super-admin/components/ui/Button";
import { loadActivePackages, PACKAGES_STORAGE_EVENT } from "../../devices-packages/data/packagesStorage";
import {
  getOfferUsageCount,
  OFFER_BOOKINGS_EVENT,
} from "../data/offerBookingsStorage";
import {
  calcOfferPrice,
  formatDiscountPercent,
  formatOfferPrice,
  parsePriceNumber,
} from "../data/offerMeta";

const labelCls = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

const EMPTY_FORM = {
  name: "",
  packageId: "",
  discountPercent: "",
  description: "",
  startDate: "",
  endDate: "",
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

const TITLES = {
  add: "إضافة عرض جديد",
  edit: "تعديل العرض",
  details: "تفاصيل العرض",
};

export default function OfferDetailsModal({ open, mode = "add", offer, onClose, onSave }) {
  const wasOpenRef = useRef(false);
  const isAdd = mode === "add";
  const isDetails = mode === "details";
  const readOnly = isDetails;
  const [form, setForm] = useState(EMPTY_FORM);
  const [usageCount, setUsageCount] = useState(0);
  const [packages, setPackages] = useState(() => loadActivePackages());

  useEffect(() => {
    const sync = () => setPackages(loadActivePackages());
    window.addEventListener(PACKAGES_STORAGE_EVENT, sync);
    return () => window.removeEventListener(PACKAGES_STORAGE_EVENT, sync);
  }, []);

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;

    if (isAdd) {
      const first = loadActivePackages()[0];
      setForm({
        ...EMPTY_FORM,
        packageId: first ? String(first.id) : "",
        discountPercent: "0",
      });
      setUsageCount(0);
      return;
    }
    if (!offer) return;
    setForm({
      name: offer.name ?? "",
      packageId: offer.packageId != null ? String(offer.packageId) : "",
      discountPercent: String(offer.discountPercent ?? 0),
      description: offer.description ?? "",
      startDate: offer.startDate?.slice(0, 10) ?? "",
      endDate: offer.endDate?.slice(0, 10) ?? "",
      isActive: offer.isActive !== false,
    });
  }, [open, mode, offer, isAdd]);

  useEffect(() => {
    if (!open || isAdd || !offer?.id) return;

    const refreshStats = () => setUsageCount(getOfferUsageCount(offer.id));
    refreshStats();
    window.addEventListener(OFFER_BOOKINGS_EVENT, refreshStats);
    return () => window.removeEventListener(OFFER_BOOKINGS_EVENT, refreshStats);
  }, [open, offer?.id, isAdd]);

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === Number(form.packageId)),
    [packages, form.packageId],
  );

  const packagePrice = parsePriceNumber(selectedPackage?.price);
  const discountPercent = parsePriceNumber(form.discountPercent);
  const offerPrice = calcOfferPrice(packagePrice, discountPercent);

  if (!open) return null;
  if (!isAdd && !offer) return null;

  const handleSave = () => {
    onSave?.({
      name: form.name.trim(),
      packageId: form.packageId ? Number(form.packageId) : null,
      discountPercent,
      description: form.description.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
    });
  };

  const activeState = form.isActive;

  const readOnlyCls = readOnly
    ? "cursor-default border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
    : "";

  return (
    <AdminModal open={open} onClose={onClose} title={TITLES[mode] || TITLES.add} wide>
      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="of-name">
                اسم العرض
              </label>
              <input
                id="of-name"
                className={`${inputCls} ${readOnlyCls}`}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="مثال: خصم نهاية الأسبوع"
                autoComplete="off"
                readOnly={readOnly}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="of-package">
                الباقة المرتبطة
              </label>
              <select
                id="of-package"
                className={`${inputCls} ${readOnlyCls}`}
                value={form.packageId}
                onChange={(e) => setForm((f) => ({ ...f, packageId: e.target.value }))}
                disabled={readOnly}
              >
                <option value="">— اختر الباقة —</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — {pkg.price}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="of-discount">
                نسبة الخصم (%)
              </label>
              <input
                id="of-discount"
                className={`${inputCls} ${readOnlyCls}`}
                value={form.discountPercent}
                onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                placeholder="مثال: 30"
                inputMode="decimal"
                dir="ltr"
                readOnly={readOnly}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className={labelCls}>سعر الباقة</label>
              <div className={`${inputCls} ${readOnlyCls} bg-gray-100 dark:bg-gray-900/50`}>
                {selectedPackage ? formatOfferPrice(packagePrice) : "—"}
              </div>
            </div>
            <div className="col-span-2">
              <div className="rounded-xl border border-[#6B5478]/20 bg-[#6B5478]/5 px-4 py-3 dark:border-[#6B5478]/30 dark:bg-[#6B5478]/10">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">سعر العرض بعد الخصم</p>
                <p className="mt-1 text-lg font-extrabold text-[#6B5478] dark:text-[#c4b5d0]">
                  {selectedPackage ? formatOfferPrice(offerPrice) : "—"}
                </p>
                {selectedPackage && discountPercent > 0 ? (
                  <p className="mt-1 text-[10px] font-semibold text-gray-400">
                    {formatOfferPrice(packagePrice)} − {formatDiscountPercent(discountPercent)} ={" "}
                    {formatOfferPrice(offerPrice)}
                  </p>
                ) : null}
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="of-start">
                تاريخ البداية
              </label>
              <input
                id="of-start"
                type="date"
                className={`${inputCls} ${readOnlyCls}`}
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                dir="ltr"
                readOnly={readOnly}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="of-end">
                تاريخ النهاية
              </label>
              <input
                id="of-end"
                type="date"
                className={`${inputCls} ${readOnlyCls}`}
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                dir="ltr"
                readOnly={readOnly}
                disabled={readOnly}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls} htmlFor="of-desc">
                وصف العرض
              </label>
              <textarea
                id="of-desc"
                rows={2}
                className={`${inputCls} resize-none ${readOnlyCls}`}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="وصف مختصر للعرض"
                readOnly={readOnly}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>

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
              value={isAdd ? "يُسجَّل عند الحفظ" : offer?.createdAt}
              ltr={!isAdd}
            />
            <SystemDetailRow
              label="عدد مرات الاستخدام"
              value={isAdd ? "0 مرة" : `${usageCount} مرة`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">حالة العرض</span>
          {readOnly ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                activeState
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {activeState ? "مفعّل" : "معطّل"}
            </span>
          ) : (
            <DeviceStatusToggle
              checked={activeState}
              onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              activeLabel="مفعّل"
              inactiveLabel="معطّل"
            />
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {readOnly ? "إغلاق" : "إلغاء"}
          </Button>
          {!readOnly ? (
            <Button size="sm" onClick={handleSave}>
              {isAdd ? "حفظ العرض" : "حفظ"}
            </Button>
          ) : null}
        </div>
      </div>
    </AdminModal>
  );
}
