import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ROLES,
  SHIFTS,
  STATUSES,
  normalizeRole,
  normalizeShift,
  normalizeStatus,
  roleLabel,
  shiftLabel,
  statusLabel,
} from "../data/employeeMeta";
import { saveEmployees } from "../data/employeesStorage";
import { confirmAction, toastSuccess } from "../utils/employeeConfirm";
import "./EmployeeModals.css";

function snapshotRoles(list) {
  return JSON.stringify(
    [...list]
      .sort((a, b) => a.id - b.id)
      .map((e) => ({ id: e.id, role: e.role, shift: e.shift, status: e.status })),
  );
}

export default function AdminEmployeesModal({ open, employees, onClose, onSaved }) {
  const [localEmployees, setLocalEmployees] = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState("");

  useEffect(() => {
    if (!open) return;
    const copy = employees.map((e) => ({ ...e }));
    setLocalEmployees(copy);
    setInitialSnapshot(snapshotRoles(copy));
    // لقطة عند فتح النافذة فقط — تجنّب مسح التعديلات عند إعادة إنشاء المصفوفة من الأب
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isDirty = snapshotRoles(localEmployees) !== initialSnapshot;

  const updateLocalRow = (rowId, field, value) => {
    setLocalEmployees((list) =>
      list.map((e) => {
        if (e.id !== rowId) return e;
        const patch = { ...e };
        if (field === "role") patch.role = normalizeRole(value);
        if (field === "shift") patch.shift = normalizeShift(value);
        if (field === "status") patch.status = normalizeStatus(value);
        return patch;
      }),
    );
  };

  const handleSave = async () => {
    const ok = await confirmAction({
      title: "حفظ التعديلات؟",
      text: "هل تريد حفظ التعديلات على الموظفين في النظام؟",
      confirmText: "نعم، احفظ",
    });
    if (!ok) return;
    saveEmployees(localEmployees);
    onSaved(localEmployees);
    setInitialSnapshot(snapshotRoles(localEmployees));
    await toastSuccess("تم الحفظ", "تم تحديث بيانات الموظفين.");
  };

  const handleClose = async () => {
    if (isDirty) {
      const ok = await confirmAction({
        title: "إغلاق النافذة؟",
        text: "لديك تغييرات لم تُحفظ بعد. هل تريد الإغلاق دون حفظ؟",
        confirmText: "نعم، أغلق",
        cancelText: "تراجع",
      });
      if (!ok) return;
    } else {
      const ok = await confirmAction({
        title: "إغلاق النافذة؟",
        text: "هل تريد إغلاق إعدادات الإدارة؟",
        confirmText: "نعم",
      });
      if (!ok) return;
    }
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="emp-modal-root" dir="rtl">
      <button type="button" className="emp-modal-backdrop" aria-label="إغلاق" onClick={handleClose} />
      <div role="dialog" aria-modal="true" className="emp-modal emp-modal--wide">
        <div className="emp-admin-modal-head">
          <div className="emp-admin-modal-head__text">
            <h2 className="emp-modal__title">إعدادات الإدارة — الموظفين</h2>
            <p className="emp-modal__subtitle">
              عدّل الوظيفة والوردية والحالة من القائمة، ثم اضغط «حفظ» لتطبيق التغييرات.
            </p>
          </div>
          <div className="emp-admin-toolbar">
            <button type="button" className="emp-modal__btn emp-modal__btn--primary" onClick={handleSave}>
              حفظ
            </button>
            <button type="button" className="emp-modal__btn emp-modal__btn--ghost" onClick={handleClose}>
              إغلاق
            </button>
          </div>
        </div>

        <div className="emp-admin-layout emp-admin-layout--full">
          <div className="emp-admin-list">
            {localEmployees.map((row) => (
              <div key={row.id} className="emp-admin-row">
                <div>
                  <div className="emp-admin-row__name">{row.fullName}</div>
                  <div className="emp-admin-row__meta">
                    {roleLabel(row.role)} · {shiftLabel(row.shift)} · {statusLabel(row.status)}
                  </div>
                </div>
                <div className="emp-admin-row__selects">
                  <select
                    value={normalizeRole(row.role)}
                    onChange={(e) => updateLocalRow(row.id, "role", e.target.value)}
                    aria-label="الوظيفة"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={normalizeShift(row.shift)}
                    onChange={(e) => updateLocalRow(row.id, "shift", e.target.value)}
                    aria-label="الوردية"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={normalizeStatus(row.status)}
                    onChange={(e) => updateLocalRow(row.id, "status", e.target.value)}
                    aria-label="الحالة"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
