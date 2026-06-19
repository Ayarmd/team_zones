import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ROLES,
  SHIFTS,
  STATUSES,
  normalizeRole,
  normalizeShift,
  normalizeStatus,
} from "../data/employeeMeta";
import { saveEmployees } from "../data/employeesStorage";
import { confirmAction, toastSuccess } from "../utils/employeeConfirm";
import "./EmployeeModals.css";

export default function EmployeeEditModal({ open, employee, employees, onClose, onSaved }) {
  const [draft, setDraft] = useState({ role: "reception", shift: "morning", status: "working" });

  useEffect(() => {
    if (!employee) return;
    setDraft({
      role: normalizeRole(employee.role),
      shift: normalizeShift(employee.shift),
      status: normalizeStatus(employee.status),
    });
  }, [employee]);

  if (!open || !employee) return null;

  const handleSave = async () => {
    const ok = await confirmAction({
      title: "هل أنت متأكد؟",
      text: `حفظ تعديلات «${employee.fullName}» (الوظيفة، الوردية، الحالة)؟`,
      confirmText: "نعم، احفظ",
    });
    if (!ok) return;

    const next = employees.map((e) =>
      e.id !== employee.id
        ? e
        : {
            ...e,
            role: normalizeRole(draft.role),
            shift: normalizeShift(draft.shift),
            status: normalizeStatus(draft.status),
          },
    );
    saveEmployees(next);
    onSaved(next);
    await toastSuccess("تم الحفظ", "تم تحديث بيانات الموظف.");
    onClose();
  };

  return createPortal(
    <div className="emp-modal-root" dir="rtl">
      <button type="button" className="emp-modal-backdrop" aria-label="إغلاق" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="emp-modal">
        <h2 className="emp-modal__title">تعديل الموظف</h2>
        <p className="emp-modal__subtitle">{employee.fullName}</p>

        <div className="emp-edit-modal__fields">
          <div className="emp-modal__field">
            <label htmlFor="edit-role">الوظيفة</label>
            <select
              id="edit-role"
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="emp-modal__field">
            <label htmlFor="edit-shift">الوردية</label>
            <select
              id="edit-shift"
              value={draft.shift}
              onChange={(e) => setDraft((d) => ({ ...d, shift: e.target.value }))}
            >
              {SHIFTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="emp-modal__field">
            <label htmlFor="edit-status">الحالة</label>
            <select
              id="edit-status"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="emp-modal__actions">
          <button type="button" className="emp-modal__btn emp-modal__btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="emp-modal__btn emp-modal__btn--primary" onClick={handleSave}>
            حفظ
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
