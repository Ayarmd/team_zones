import { useEffect, useState } from "react";
import AdminModal from "../../devices-packages/components/AdminModal";
import Button from "../../super-admin/components/ui/Button";
import { loadPackages } from "../../devices-packages/data/packagesStorage";
import { calcHourTo } from "../data/receptionCalendarStorage";
import { loadCalendarDevices } from "../utils/receptionCalendarUtils";

const labelCls = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

export default function ReceptionSessionEditModal({ open, slot, device, onClose, onSave }) {
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [hourTo, setHourTo] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [packageId, setPackageId] = useState("");

  const devices = loadCalendarDevices();
  const packages = loadPackages().filter((p) => p.isActive !== false);

  useEffect(() => {
    if (!open || !slot) return;
    setVisitorName(slot.visitorName || "");
    setPhone(slot.phone || "");
    setDate(slot.date || "");
    setHour(slot.hour || "");
    setHourTo(slot.hourTo || slot.hour || "");
    setDeviceId(String(slot.deviceId || ""));
    setPackageId(slot.packageId != null ? String(slot.packageId) : "");
  }, [open, slot]);

  useEffect(() => {
    if (!packageId) return;
    const pkg = packages.find((p) => String(p.id) === packageId);
    if (pkg && hour) setHourTo(calcHourTo(hour, pkg.hours));
  }, [packageId, hour, packages]);

  if (!open || !slot) return null;

  const submit = (e) => {
    e.preventDefault();
    const dev = devices.find((d) => String(d.id) === deviceId);
    const pkg = packages.find((p) => String(p.id) === packageId);
    onSave?.({
      visitorName: visitorName.trim(),
      phone: phone.trim(),
      date,
      hour,
      hourTo,
      deviceId: dev ? dev.id : slot.deviceId,
      packageId: pkg ? pkg.id : slot.packageId,
      packageName: pkg?.name || slot.packageName,
      packagePrice: pkg?.price || slot.packagePrice,
    });
  };

  return (
    <AdminModal open={open} onClose={onClose} title="تعديل الجلسة" wide>
      <form onSubmit={submit} className="mt-4 space-y-3" dir="rtl">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>اسم الزبون</label>
            <input className={inputCls} value={visitorName} onChange={(e) => setVisitorName(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>رقم الهاتف</label>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className={labelCls}>التاريخ</label>
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" required />
          </div>
          <div>
            <label className={labelCls}>الجهاز</label>
            <select className={inputCls} value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>الباقة</label>
            <select className={inputCls} value={packageId} onChange={(e) => setPackageId(e.target.value)}>
              <option value="">—</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.price})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>من ساعة</label>
            <input className={inputCls} value={hour} onChange={(e) => setHour(e.target.value)} dir="ltr" required />
          </div>
          <div>
            <label className={labelCls}>إلى ساعة</label>
            <input className={inputCls} value={hourTo} onChange={(e) => setHourTo(e.target.value)} dir="ltr" required />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" size="sm">
            حفظ
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
