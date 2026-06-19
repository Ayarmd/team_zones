import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import {
  ROLE_PERMISSIONS,
  formatSalary,
  roleLabel,
  shiftLabel,
  normalizeStatus,
  statusLabel,
} from "../data/employeeMeta";
import { loadEmployees } from "../data/employeesStorage";
import "./EmployeesPage.css";

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const employee = useMemo(() => {
    return loadEmployees().find((e) => String(e.id) === String(id)) ?? null;
  }, [id]);

  if (!employee) {
    return (
      <ManagerLayout title="الموظف غير موجود">
        <p className="emp-empty">لم يتم العثور على هذا الموظف.</p>
        <button type="button" className="emp-btn-ghost" onClick={() => navigate("/employees")}>
          العودة للقائمة
        </button>
      </ManagerLayout>
    );
  }

  const permissions = ROLE_PERMISSIONS[employee.role] ?? [];
  const status = normalizeStatus(employee.status);

  return (
    <ManagerLayout title="تفاصيل الموظف">
      <div className="emp-page" dir="rtl">
        <div className="emp-detail-header">
          <div className="emp-detail-profile">
            <div className="emp-detail-meta">
              <h2>{employee.fullName}</h2>
              <p>
                {roleLabel(employee.role)} · {shiftLabel(employee.shift)} ·{" "}
                <span className={`emp-badge emp-badge--${status}`}>{statusLabel(status)}</span>
              </p>
            </div>
          </div>
          <div className="emp-form-actions">
            <button type="button" className="emp-btn-ghost" onClick={() => navigate("/employees")}>
              <ArrowRight size={16} />
              القائمة
            </button>
          </div>
        </div>

        <div className="emp-detail-grid">
          <div className="emp-form-card">
            <h3 className="text-sm font-bold text-slate-300 mb-3">البيانات الشخصية</h3>
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
          </div>

          <div className="emp-form-card">
            <h3 className="text-sm font-bold text-slate-300 mb-3">الصلاحيات حسب الوظيفة</h3>
            <ul className="emp-perm-list">
              {permissions.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <h3 className="text-sm font-bold text-slate-300 mb-3 mt-4">إحصائيات الشهر</h3>
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
      </div>
    </ManagerLayout>
  );
}
