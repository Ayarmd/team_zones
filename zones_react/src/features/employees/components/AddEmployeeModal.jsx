import { useState } from "react";
import { createPortal } from "react-dom";
import { Mail, Settings2 } from "lucide-react";
import RoleToggleGroup from "./RoleToggleGroup";
import ShiftToggleGroup from "./ShiftToggleGroup";
import { savePendingInvite } from "../data/pendingInviteStorage";
import { useZonesToast } from "../../../shared/context/ZonesToastContext";
import "./EmployeeModals.css";

export default function AddEmployeeModal({ open, onClose, onOpenAdmin }) {
  const { showInviteSentToast } = useZonesToast();
  const [step, setStep] = useState("choice");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("reception");
  const [shift, setShift] = useState("morning");
  const [error, setError] = useState("");

  const reset = () => {
    setStep("choice");
    setEmail("");
    setRole("reception");
    setShift("morning");
    setError("");
  };

  const handleClose = () => {
    reset();
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

  if (!open) return null;

  return createPortal(
    <div className="emp-modal-root" dir="rtl">
      <button type="button" className="emp-modal-backdrop" aria-label="إغلاق" onClick={handleClose} />
      <div role="dialog" aria-modal="true" className="emp-modal">
        {step === "choice" ? (
          <>
            <h2 className="emp-modal__title">إضافة موظف</h2>
            <p className="emp-modal__subtitle">اختر طريقة إضافة الموظف إلى النظام</p>
            <div className="emp-modal__choices">
              <button
                type="button"
                className="emp-modal__choice"
                onClick={() => setStep("invite")}
              >
                <Mail size={18} className="mb-1 text-indigo-300" />
                <strong>إرسال دعوة</strong>
                <span>أدخل بريد الموظف — يصله رابط لإكمال بياناته بنفسه</span>
              </button>
              <button
                type="button"
                className="emp-modal__choice"
                onClick={() => {
                  handleClose();
                  onOpenAdmin();
                }}
              >
                <Settings2 size={18} className="mb-1 text-cyan-300" />
                <strong>إعدادات الإدارة</strong>
                <span>عرض كل الموظفين وتعديل الوظيفة والوردية والحالة</span>
              </button>
            </div>
            <div className="emp-modal__actions">
              <button type="button" className="emp-modal__btn emp-modal__btn--ghost" onClick={handleClose}>
                إلغاء
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="emp-modal__title">إرسال دعوة</h2>
            <p className="emp-modal__subtitle">أدخل بريد الموظف لإنشاء رابط التسجيل</p>
            <div className="emp-modal__field">
              <label htmlFor="invite-email">البريد الإلكتروني</label>
              <input
                id="invite-email"
                type="email"
                dir="ltr"
                placeholder="employee@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="emp-modal__field">
              <label>نوع الموظف</label>
              <RoleToggleGroup value={role} onChange={setRole} />
            </div>
            <div className="emp-modal__field">
              <label>نوع الدوام</label>
              <ShiftToggleGroup value={shift} onChange={setShift} />
            </div>
            {error ? <p className="text-red-400 text-xs mb-2">{error}</p> : null}
            <div className="emp-modal__actions">
              <button type="button" className="emp-modal__btn emp-modal__btn--ghost" onClick={() => setStep("choice")}>
                رجوع
              </button>
              <button type="button" className="emp-modal__btn emp-modal__btn--primary" onClick={sendInvite}>
                إرسال الدعوة
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
