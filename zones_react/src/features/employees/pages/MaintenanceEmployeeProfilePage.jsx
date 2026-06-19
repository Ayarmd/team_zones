import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
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
import { zonesSwal, zonesToastError, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import ConfirmModal from "../../super-admin/components/ui/ConfirmModal";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import {
  clearAuthSession,
  deleteUserAccount,
  getAuthSession,
  updateUserProfile,
} from "../../auth/data/mockUsersStorage";
import { useRequireAccountUser } from "../../../shared/hooks/useAccountUser";
import {
  formatDateAr,
  formatDateTimeAr,
  formatSalary,
  roleLabel,
  shiftLabel,
  statusLabel,
  workDaysLabel,
} from "../data/employeeMeta";
import { getLinkedEmployeeRecord, getMaintenanceProfileBundle } from "../data/maintenanceEmployeeProfileData";
import { IconField } from "../../../components/ui/icon-field";

export default function MaintenanceEmployeeProfilePage() {
  const navigate = useNavigate();
  const user = useRequireAccountUser();
  const { hallName } = getMaintenanceProfileBundle();
  const employee = getLinkedEmployeeRecord(user);
  const fileRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setAvatar(user.avatar || "");
  }, [user]);

  const joinDate = employee?.joinDate || employee?.workStartDate || user?.joinDate || "—";
  const lastLogin = employee?.lastLogin
    ? formatDateTimeAr(employee.lastLogin)
    : getAuthSession()?.loggedInAt
      ? formatDateTimeAr(getAuthSession().loggedInAt)
      : "—";

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
        if (user?.id) {
          updateUserProfile(user.id, { avatar: reader.result });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!user?.id) return;
    const res = updateUserProfile(user.id, {
      fullName,
      email,
      phone,
      avatar,
    });
    if (!res.ok) {
      zonesToastError(res.error);
      return;
    }
    setEditing(false);
    zonesToastSuccess("تم حفظ التعديلات");
  };

  const deleteAccount = async () => {
    if (!user?.id) return;
    setDeleteOpen(false);

    const { value: password, isConfirmed } = await zonesSwal({
      title: "تأكيد الحذف",
      text: "أدخل كلمة المرور الحالية لحذف الحساب نهائياً",
      input: "password",
      inputPlaceholder: "كلمة المرور",
      inputAttributes: { autocomplete: "current-password", dir: "ltr" },
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "حذف نهائياً",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#dc2626",
      inputValidator: (v) => (!v ? "أدخل كلمة المرور" : undefined),
    });
    if (!isConfirmed || !password) return;

    const res = deleteUserAccount(user.id, password);
    if (!res.ok) {
      zonesToastError(res.error || "تعذر حذف الحساب.");
      return;
    }
    clearAuthSession();
    navigate("/auth/login", { replace: true, state: { message: "تم حذف حسابك." } });
  };

  if (!user) return null;

  return (
    <div>
      <PageHeader title="حسابي" description="إدارة بياناتك الشخصية — بيانات الوظيفة يحددها مدير الصالة." />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
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
            <IconField
              label="البريد الإلكتروني"
              icon={Mail}
              value={email}
              onChange={setEmail}
              disabled={!editing}
              type="email"
              ltr
            />
            <IconField label="رقم الهاتف" icon={Phone} value={phone} onChange={setPhone} disabled={!editing} ltr />
            <IconField
              label="اسم الصالة المرتبط بها"
              icon={Building2}
              value={hallName}
              disabled
              hint="يُحدَّد من إعدادات الصالة — للقراءة فقط"
            />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
            <h3 className="mb-3 text-xs font-extrabold text-gray-700 dark:text-gray-200">
              بيانات الوظيفة (يتحكم بها المدير)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <IconField label="نوع الموظف" value={roleLabel(employee?.role || "maintenance")} disabled />
              <IconField label="توقيت الدوام" value={shiftLabel(employee?.shift)} disabled />
              <IconField label="أيام العمل" value={workDaysLabel(employee?.workDays)} disabled />
              <IconField label="ساعات العمل" icon={Clock} value={employee?.workHours || "—"} disabled ltr />
              <IconField label="الراتب الشهري" value={formatSalary(employee?.salary)} disabled />
              <IconField label="الحالة" value={statusLabel(employee?.status)} disabled />
            </div>
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
            <span className="text-xs font-bold text-[#6B5478]">موظف صيانة</span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={11} /> {statusLabel(employee?.status) || "نشط"}
            </span>
          </div>

          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-right dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CalendarDays size={14} className="text-[#6B5478]" />
              تاريخ الانضمام:
              <strong className="text-gray-800 dark:text-gray-200" dir="ltr">
                {formatDateAr(joinDate)}
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

        <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm dark:border-red-900/40 dark:bg-red-950/10 lg:col-span-3">
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
        title="حذف حسابك؟"
        message="سيتم حذف بيانات الدخول والملف المرتبط. لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف نهائياً"
        danger
        onConfirm={deleteAccount}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
