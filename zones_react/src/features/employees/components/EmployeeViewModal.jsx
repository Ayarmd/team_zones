import { createPortal } from "react-dom";
import { X } from "lucide-react";
import IconButton from "../../../shared/components/ui/IconButton";
import {
  ROLE_PERMISSIONS,
  formatSalary,
  normalizeStatus,
  roleLabel,
  shiftLabel,
  statusLabel,
} from "../data/employeeMeta";
import "./EmployeeModals.css";
import "../pages/EmployeesPage.css";

export default function EmployeeViewModal({ open, employee, onClose }) {
  if (!open || !employee) return null;

  const status = normalizeStatus(employee.status);
  const permissions = ROLE_PERMISSIONS[employee.role] ?? [];

  return createPortal(
    <div className="emp-modal-root" dir="rtl">
      <button type="button" className="emp-modal-backdrop" aria-label="إغلاق" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="emp-modal emp-modal--view">
        <IconButton
          icon={X}
          label="إغلاق"
          tone="muted"
          className="emp-view-modal__close"
          onClick={onClose}
        />

        <div className="emp-view-modal__header">
          <div>
            <h2 className="emp-modal__title">{employee.fullName}</h2>
            <p className="emp-view-modal__subtitle">
              {roleLabel(employee.role)} · {shiftLabel(employee.shift)} ·{" "}
              <span className={`emp-badge emp-badge--${status}`}>{statusLabel(status)}</span>
            </p>
          </div>
        </div>

        <p className="emp-view-modal__hint">عرض البيانات فقط — للتعديل استخدم أيقونة القلم في الجدول</p>

        <div className="emp-view-modal__grid">
          <div className="emp-info-list">
            <div className="emp-info-row">
              <span>الهاتف</span>
              <strong dir="ltr">{employee.phone || "—"}</strong>
            </div>
            <div className="emp-info-row">
              <span>البريد</span>
              <strong dir="ltr">{employee.email || "—"}</strong>
            </div>
            <div className="emp-info-row">
              <span>تاريخ التعيين</span>
              <strong>{employee.hireDate || "—"}</strong>
            </div>
            <div className="emp-info-row">
              <span>الراتب</span>
              <strong>{formatSalary(employee.salary)}</strong>
            </div>
            {employee.notes ? (
              <div className="emp-info-row">
                <span>ملاحظات</span>
                <strong>{employee.notes}</strong>
              </div>
            ) : null}
          </div>

          <div className="emp-view-modal__side">
            <h3 className="emp-view-modal__section-title">الصلاحيات</h3>
            <ul className="emp-perm-list">
              {permissions.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <h3 className="emp-view-modal__section-title">إحصائيات الشهر</h3>
            <div className="emp-mini-stats">
              <div className="emp-mini-stat">
                <span>ساعات العمل</span>
                <strong>{employee.hoursThisMonth ?? 0}</strong>
              </div>
              <div className="emp-mini-stat">
                <span>الورديات</span>
                <strong>{employee.shiftsThisMonth ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="emp-modal__actions">
          <button type="button" className="emp-modal__btn emp-modal__btn--ghost" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
