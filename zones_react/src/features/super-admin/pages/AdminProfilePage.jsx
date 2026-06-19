import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Mail,
  Pencil,
  Phone,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import ConfirmModal from "../components/ui/ConfirmModal";
import PageHeader from "../components/ui/PageHeader";
import {
  clearSuperAdminSession,
  getSuperAdminSession,
  updateSuperAdminProfile,
} from "../data/superAdminAuth";
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_ROUTES } from "../data/superAdminConstants";
import { IconField } from "../../../components/ui/icon-field";

export default function AdminProfilePage() {
  const navigate = useNavigate();
  const session = getSuperAdminSession();
  const fileRef = useRef(null);

  const [fullName, setFullName] = useState(session?.fullName || "");
  const email = SUPER_ADMIN_EMAIL;
  const [phone, setPhone] = useState(session?.phone || "");
  const [avatar, setAvatar] = useState(session?.avatar || "");
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const lastLogin = session?.loggedInAt
    ? new Date(session.loggedInAt).toLocaleString("ar-LY", { hour: "2-digit", minute: "2-digit" })
    : "اليوم 09:30 ص";

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
        updateSuperAdminProfile({ avatar: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    updateSuperAdminProfile({ fullName, email: SUPER_ADMIN_EMAIL, phone });
    setEditing(false);
    zonesToastSuccess("تم حفظ التعديلات");
  };

  const deleteAccount = () => {
    clearSuperAdminSession();
    setDeleteOpen(false);
    navigate(SUPER_ADMIN_ROUTES.login, { replace: true, state: { message: "تم حذف حساب الأدمن." } });
  };

  return (
    <div>
      <PageHeader title="حسابي" description="إدارة بياناتك الشخصية وأمان حسابك." />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
              <User size={16} className="text-[#6B5478]" /> المعلومات الشخصية
            </h2>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-1.5 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Pencil size={13} /> تعديل
              </button>
            ) : (
              <button
                type="button"
                onClick={save}
                className="flex items-center gap-1.5 rounded-xl bg-[#6B5478] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#5a4665]"
              >
                <Save size={13} /> حفظ
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <IconField label="الاسم الكامل" icon={User} value={fullName} onChange={setFullName} disabled={!editing} />
            <IconField label="البريد الإلكتروني (بريد الدخول)" icon={Mail} value={email} onChange={() => {}} disabled type="email" ltr />
            <IconField label="رقم الهاتف" icon={Phone} value={phone} onChange={setPhone} disabled={!editing} ltr />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-right text-sm font-extrabold text-gray-900 dark:text-white">ملخص الملف الشخصي</h2>
          <div className="relative mx-auto h-24 w-24">
            {avatar ? (
              <img src={avatar} alt={fullName} className="h-24 w-24 rounded-full object-cover ring-4 ring-[#6B5478]/15" />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#6B5478]/12 text-[#6B5478] ring-4 ring-[#6B5478]/15">
                <User size={40} />
              </span>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 left-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#6B5478] text-white shadow dark:border-gray-900"
              aria-label="تغيير الصورة"
            >
              <Camera size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
          </div>

          <h3 className="mt-3 text-base font-extrabold text-gray-900 dark:text-white">{fullName}</h3>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-[#6B5478]">مدير النظام</span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={11} /> نشط
            </span>
          </div>

          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-right dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CalendarDays size={14} className="text-[#6B5478]" />
              تاريخ الانضمام:
              <strong className="text-gray-800 dark:text-gray-200" dir="ltr">
                {session?.joinDate || "2024/01/15"}
              </strong>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} className="text-[#6B5478]" />
              آخر تسجيل دخول:
              <strong className="text-gray-800 dark:text-gray-200">{lastLogin}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Camera size={14} /> تغيير الصورة
          </button>
        </section>

        <section className="lg:col-span-3 rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm dark:border-red-900/40 dark:bg-red-950/10">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-extrabold text-red-700 dark:text-red-300">
            <Trash2 size={16} /> حذف الحساب
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-red-700/90 dark:text-red-300/90">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              حذف الحساب إجراء نهائي يؤدي إلى إزالة جميع بياناتك بشكل دائم ولا يمكن التراجع عنه. الرجاء التأكد قبل المتابعة.
            </p>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              <Trash2 size={14} /> حذف الحساب نهائياً
            </button>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="حذف حساب الأدمن؟"
        message="سيتم إنهاء الجلسة وحذف بيانات الدخول المحلية. لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف نهائياً"
        danger
        onConfirm={deleteAccount}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
