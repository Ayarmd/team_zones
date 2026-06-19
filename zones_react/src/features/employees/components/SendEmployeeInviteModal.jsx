import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import AdminModal from "../../devices-packages/components/AdminModal";
import IconGlyph from "../../../shared/components/ui/IconGlyph";
import RoleToggleGroup from "./RoleToggleGroup";
import ShiftToggleGroup from "./ShiftToggleGroup";
import { savePendingInvite } from "../data/pendingInviteStorage";
import { useZonesToast } from "../../../shared/context/ZonesToastContext";

const labelCls = "mb-1 block text-xs font-bold text-gray-600 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#6B5478] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

export default function SendEmployeeInviteModal({
  open,
  onClose,
  defaultRole = "reception",
}) {
  const { showInviteSentToast } = useZonesToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [shift, setShift] = useState("morning");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setRole(defaultRole);
    setShift("morning");
    setError("");
  }, [open, defaultRole]);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const sendInvite = () => {
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }
    savePendingInvite({ email: trimmed, role, shift });
    showInviteSentToast();
    handleClose();
  };

  return (
    <AdminModal open={open} onClose={handleClose} title="إرسال دعوة موظف">
      <div className="mt-4 space-y-4" dir="rtl">
        <div className="flex items-center gap-3 rounded-xl border border-[#6B5478]/20 bg-[#6B5478]/5 px-4 py-3 dark:border-[#6B5478]/30 dark:bg-[#6B5478]/10">
          <IconGlyph icon={Mail} tone="primary" size={18} />
          <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
            أدخل بريد الموظف الإلكتروني — سيصله رابط لإكمال بياناته وتسجيل حسابه في النظام.
          </p>
        </div>

        <div>
          <label className={labelCls} htmlFor="invite-email">
            البريد الإلكتروني
          </label>
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
          <label className={labelCls}>وظيفة الموظف</label>
          <RoleToggleGroup value={role} onChange={setRole} />
        </div>

        <div>
          <label className={labelCls}>نوع الدوام</label>
          <ShiftToggleGroup value={shift} onChange={setShift} />
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
            className="rounded-xl bg-[#6B5478] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#6B5478]/30"
          >
            إرسال الدعوة
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
