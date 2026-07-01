import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import AdminModal from "../../devices-packages/components/AdminModal";
import IconGlyph from "../../../shared/components/ui/IconGlyph";
import { ROLES, SHIFTS } from "../data/employeeMeta";
import { sendEmployeeInvitation } from "../data/employeeInvitationsApi";

const labelCls = "mb-1 block text-xs font-bold text-gray-600 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#6B5478] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

export default function SendEmployeeInviteModal({ open, onClose, onSent }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("reception");
  const [shift, setShift] = useState("morning");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setRole("reception");
    setShift("morning");
    setError("");
    setSending(false);
  }, [open]);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const sendInvite = async () => {
    setError("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("اسم الموظف مطلوب.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }

    setSending(true);
    const result = await sendEmployeeInvitation({
      name: trimmedName,
      email: trimmedEmail,
      role,
      shift,
    });
    setSending(false);

    if (!result.ok) {
      setError(result.error || "تعذر إرسال الدعوة.");
      return;
    }

    onSent?.({
      ...result,
      recipientEmail: trimmedEmail,
    });
    handleClose();
  };

  return (
    <AdminModal open={open} onClose={handleClose} title="إضافة موظف">
      <div className="mt-4 space-y-4" dir="rtl">
        <div className="flex items-center gap-3 rounded-xl border border-[#6B5478]/20 bg-[#6B5478]/5 px-4 py-3 dark:border-[#6B5478]/30 dark:bg-[#6B5478]/10">
          <IconGlyph icon={Mail} tone="primary" size={18} />
          <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
            سيصل الموظف بريداً يحتوي رابط التسجيل مع الصلاحية وتوقيت الدوام المحددين.
          </p>
        </div>

        <div>
          <label className={labelCls} htmlFor="invite-name">اسم الموظف</label>
          <input
            id="invite-name"
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="invite-email">البريد الإلكتروني</label>
          <input
            id="invite-email"
            type="email"
            dir="ltr"
            className={inputCls}
            placeholder="employee@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="invite-role">الصلاحية</label>
          <select
            id="invite-role"
            className={inputCls}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="invite-shift">توقيت الدوام</label>
          <select
            id="invite-shift"
            className={inputCls}
            value={shift}
            onChange={(e) => setShift(e.target.value)}
          >
            {SHIFTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.hours}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="text-xs font-semibold text-red-500">{error}</p> : null}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 dark:border-gray-700"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={sendInvite}
            disabled={sending}
            className="rounded-xl bg-[#6B5478] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#6B5478]/30 disabled:opacity-60"
          >
            {sending ? "جاري الإرسال..." : "إرسال الدعوة"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
