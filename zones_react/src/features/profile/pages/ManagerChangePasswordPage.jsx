import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { zonesToastError, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import { changeStaffPassword } from "../../auth/data/staffProfileApi";
import { PasswordField } from "../../../components/ui/icon-field";

export default function ManagerChangePasswordPage() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      zonesToastError("تأكيد كلمة المرور غير متطابق");
      return;
    }

    setSubmitting(true);
    const res = await changeStaffPassword(oldPass, newPass);
    setSubmitting(false);

    if (!res.ok) {
      zonesToastError(res.error);
      return;
    }

    setOldPass("");
    setNewPass("");
    setConfirmPass("");
    zonesToastSuccess("تم تغيير كلمة المرور");
  };

  return (
    <>
      <PageHeader title="تغيير كلمة المرور" />

      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
          <KeyRound size={16} className="text-[#6B5478]" /> الأمان / تغيير كلمة المرور
        </h2>

        <form onSubmit={submit} className="space-y-4">
          <PasswordField label="كلمة المرور الحالية" value={oldPass} onChange={setOldPass} />
          <PasswordField label="كلمة المرور الجديدة" value={newPass} onChange={setNewPass} />
          <PasswordField label="تأكيد كلمة المرور الجديدة" value={confirmPass} onChange={setConfirmPass} />

          <div className="flex items-start gap-2 rounded-xl bg-[#6B5478]/8 px-3 py-2.5 text-[11px] text-gray-600 dark:text-gray-300">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#6B5478]" />
            يفضّل استخدام كلمة مرور قوية (8 أحرف على الأقل).
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#6B5478] py-2.5 text-xs font-bold text-white transition hover:bg-[#5a4665] disabled:opacity-60"
          >
            {submitting ? "جاري الحفظ..." : "تغيير كلمة المرور"}
          </button>
        </form>
      </div>
    </>
  );
}
