import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import { confirmAction, zonesSwal, zonesToastWarning } from "../utils/employeeConfirm";
import {
  EMPTY_EMPLOYEE,
  ROLES,
  SHIFTS,
  STATUSES,
  normalizeRole,
  normalizeShift,
  normalizeStatus,
} from "../data/employeeMeta";
import { loadEmployees, nextEmployeeId, saveEmployees } from "../data/employeesStorage";
import "./EmployeesPage.css";

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ ...EMPTY_EMPLOYEE });

  useEffect(() => {
    if (!isEdit) return;
    const list = loadEmployees();
    const found = list.find((e) => String(e.id) === String(id));
    if (!found) {
      navigate("/employees", { replace: true });
      return;
    }
    setForm({
      fullName: found.fullName ?? "",
      phone: found.phone ?? "",
      email: found.email ?? "",
      role: normalizeRole(found.role),
      shift: normalizeShift(found.shift),
      status: normalizeStatus(found.status),
      hireDate: found.hireDate ?? "",
      salary: found.salary ?? "",
      notes: found.notes ?? "",
    });
  }, [id, isEdit, navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      zonesToastWarning("الاسم مطلوب");
      return;
    }
    if (!form.phone.trim()) {
      zonesToastWarning("رقم الهاتف مطلوب");
      return;
    }

    const ok = await confirmAction({
      title: "هل أنت متأكد؟",
      text: isEdit ? "حفظ تعديلات هذا الموظف؟" : "إضافة هذا الموظف إلى النظام؟",
      confirmText: "نعم، احفظ",
    });
    if (!ok) return;

    const list = loadEmployees();
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      role: normalizeRole(form.role),
      shift: normalizeShift(form.shift),
      status: normalizeStatus(form.status),
      hireDate: form.hireDate,
      salary: form.salary === "" ? 0 : Number(form.salary),
      notes: form.notes.trim(),
      hoursThisMonth: 0,
      shiftsThisMonth: 0,
    };

    if (isEdit) {
      const next = list.map((e) =>
        String(e.id) === String(id)
          ? { ...e, ...payload, hoursThisMonth: e.hoursThisMonth, shiftsThisMonth: e.shiftsThisMonth }
          : e,
      );
      saveEmployees(next);
    } else {
      saveEmployees([
        ...list,
        {
          id: nextEmployeeId(list),
          ...payload,
          hoursThisMonth: 120 + Math.floor(Math.random() * 40),
          shiftsThisMonth: 16 + Math.floor(Math.random() * 6),
        },
      ]);
    }

    zonesSwal({
      title: isEdit ? "تم التحديث" : "تمت الإضافة",
      text: "تم حفظ بيانات الموظف في النظام.",
      icon: "success",
      confirmButtonText: "حسناً",
    }).then(() => navigate(isEdit ? `/employees/${id}` : "/employees"));
  };

  return (
    <ManagerLayout
      title={isEdit ? "تعديل موظف" : "إضافة موظف"}
    >
      <form className="emp-form-page" dir="rtl" onSubmit={submit}>
        <div className="emp-form-card">
          <div className="emp-form-grid">
            <div className="emp-field">
              <label htmlFor="fullName">الاسم الكامل</label>
              <input id="fullName" value={form.fullName} onChange={set("fullName")} required />
            </div>
            <div className="emp-field">
              <label htmlFor="phone">رقم الهاتف</label>
              <input id="phone" value={form.phone} onChange={set("phone")} dir="ltr" required />
            </div>
            <div className="emp-field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input id="email" type="email" value={form.email} onChange={set("email")} dir="ltr" />
            </div>
            <div className="emp-field">
              <label htmlFor="role">الوظيفة</label>
              <select id="role" value={form.role} onChange={set("role")}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="emp-field">
              <label htmlFor="shift">الوردية</label>
              <select id="shift" value={form.shift} onChange={set("shift")}>
                {SHIFTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="emp-field">
              <label htmlFor="status">الحالة</label>
              <select id="status" value={form.status} onChange={set("status")}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="emp-field">
              <label htmlFor="hireDate">تاريخ التعيين</label>
              <input id="hireDate" type="date" value={form.hireDate} onChange={set("hireDate")} />
            </div>
            <div className="emp-field">
              <label htmlFor="salary">الراتب الشهري (د.ل)</label>
              <input id="salary" type="number" min="0" value={form.salary} onChange={set("salary")} />
            </div>
            <div className="emp-field full">
              <label htmlFor="notes">ملاحظات</label>
              <textarea id="notes" value={form.notes} onChange={set("notes")} />
            </div>
          </div>
          <div className="emp-form-actions">
            <button type="submit" className="emp-btn-primary">
              {isEdit ? "حفظ التعديلات" : "إضافة الموظف"}
            </button>
            <button type="button" className="emp-btn-ghost" onClick={() => navigate(-1)}>
              إلغاء
            </button>
          </div>
        </div>
      </form>
    </ManagerLayout>
  );
}
