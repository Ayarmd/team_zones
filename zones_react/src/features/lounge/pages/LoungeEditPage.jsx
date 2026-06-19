import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Save,
} from "lucide-react";
import { zonesToastError, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import { getHallStatusMeta, loadManagerHall, saveManagerHall } from "../data/managerHallStorage";

const labelClass = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";
const readOnlyCls =
  "w-full cursor-default rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300";

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className={labelClass}>
        {Icon ? <Icon size={12} className="me-1 inline text-[#6B5478]" /> : null}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function LoungeEditPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const initial = loadManagerHall();

  const [form, setForm] = useState({ ...initial });
  const statusMeta = getHallStatusMeta(form.status);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") set("image", reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveChanges = (e) => {
    e.preventDefault();
    if (!form.hallName.trim()) {
      zonesToastError("اسم الصالة مطلوب");
      return;
    }
    saveManagerHall({
      hallName: form.hallName.trim(),
      hallType: form.hallType,
      city: form.city.trim(),
      address: form.address.trim(),
      mapLink: form.mapLink.trim(),
      phone: form.phone.trim(),
      workHoursFrom: form.workHoursFrom,
      workHoursTo: form.workHoursTo,
      image: form.image,
    });
    zonesToastSuccess("تم حفظ بيانات الصالة");
    navigate("/lounge");
  };

  return (
    <ManagerLayout>
      <PageHeader title="تعديل بيانات الصالة" description="حدّث معلومات صالتك — الحقول المقفلة يحددها النظام." />

      <form onSubmit={saveChanges} className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-extrabold text-gray-900 dark:text-white">صورة الصالة</h2>
          <img
            src={form.image}
            alt="معاينة"
            className="mb-3 h-40 w-full rounded-2xl object-cover"
          />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 dark:border-gray-700 dark:text-gray-200"
          >
            تغيير الصورة
          </button>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-extrabold text-gray-900 dark:text-white">البيانات الأساسية</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الصالة" icon={Building2}>
              <input
                className={inputCls}
                value={form.hallName}
                onChange={(e) => set("hallName", e.target.value)}
                required
              />
            </Field>
            <Field label="نوع الصالة" icon={Building2}>
              <input
                className={inputCls}
                value={form.hallType}
                onChange={(e) => set("hallType", e.target.value)}
                placeholder="مثال: صالة ألعاب، VR، بلايستيشن..."
              />
            </Field>
            <Field label="المدينة" icon={MapPin}>
              <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="العنوان" icon={MapPin}>
              <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="الموقع — رابط Google Maps" icon={MapPin}>
                <input
                  className={inputCls}
                  type="url"
                  dir="ltr"
                  value={form.mapLink}
                  onChange={(e) => set("mapLink", e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-extrabold text-gray-900 dark:text-white">التواصل والتشغيل</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الهاتف" icon={Phone}>
              <input
                className={inputCls}
                dir="ltr"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label="ساعات العمل — من" icon={Clock}>
              <input
                className={inputCls}
                type="time"
                dir="ltr"
                value={form.workHoursFrom}
                onChange={(e) => set("workHoursFrom", e.target.value)}
              />
            </Field>
            <Field label="ساعات العمل — إلى" icon={Clock}>
              <input
                className={inputCls}
                type="time"
                dir="ltr"
                value={form.workHoursTo}
                onChange={(e) => set("workHoursTo", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
          <h2 className="mb-4 text-sm font-extrabold text-gray-900 dark:text-white">يحددها النظام والإدارة</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="تاريخ الانضمام" icon={CalendarDays}>
              <input
                className={readOnlyCls}
                readOnly
                dir="ltr"
                value={form.joinDate?.replaceAll("-", "/") || "—"}
              />
            </Field>
            <Field label="حالة الصالة" icon={Building2}>
              <input className={readOnlyCls} readOnly value={statusMeta.label} />
            </Field>
          </div>
          <p className="mt-3 text-[10px] text-gray-500">
            تاريخ الانضمام يُسجّل تلقائياً عند أول دخول للمدير إلى المنصة. حالة الصالة يحددها الأدمن (نشطة / معطلة / قيد المراجعة).
          </p>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <Link
            to="/lounge"
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-bold text-gray-700 dark:border-gray-700 dark:text-gray-200"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-[#6B5478] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#5a4665]"
          >
            <Save size={14} /> حفظ التغييرات
          </button>
        </div>
      </form>
    </ManagerLayout>
  );
}
