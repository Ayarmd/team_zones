import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zonesSwal, zonesToastWarning } from "../../../shared/utils/zonesAlerts";
import Logo from "../../../shared/components/Logo";
import { EMPTY_EMPLOYEE, ROLES, SHIFTS } from "../data/employeeMeta";
import { getInviteByToken, markInviteUsed } from "../data/employeeInvitesStorage";
import { loadEmployees, nextEmployeeId, saveEmployees } from "../data/employeesStorage";
import "./EmployeesPage.css";
import "../components/EmployeeModals.css";

export default function EmployeeInviteRegisterPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [form, setForm] = useState({
    ...EMPTY_EMPLOYEE,
    email: "",
    status: "working",
    role: "reception",
    shift: "morning",
  });

  useEffect(() => {
    const found = getInviteByToken(token);
    if (!found) {
      zonesSwal({
        title: "رابط غير صالح",
        text: "انتهت صلاحية الدعوة أو تم استخدامها مسبقاً.",
        icon: "error",
        confirmButtonText: "حسناً",
      }).then(() => navigate("/auth/login", { replace: true }));
      return;
    }
    setInvite(found);
    setForm((f) => ({ ...f, email: found.email }));
  }, [token, navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      zonesToastWarning("الاسم والهاتف مطلوبان");
      return;
    }

    const list = loadEmployees();
    saveEmployees([
      ...list,
      {
        id: nextEmployeeId(list),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: invite?.email ?? form.email.trim(),
        role: form.role,
        shift: form.shift,
        status: "working",
        hireDate: new Date().toISOString().slice(0, 10),
        salary: form.salary === "" ? 0 : Number(form.salary),
        notes: form.notes.trim(),
        hoursThisMonth: 0,
        shiftsThisMonth: 0,
      },
    ]);
    markInviteUsed(token);

    zonesSwal({
      title: "تم التسجيل",
      text: "تم حفظ بياناتك في نظام ZONES بنجاح.",
      icon: "success",
      confirmButtonText: "حسناً",
    }).then(() => navigate("/auth/login", { replace: true }));
  };

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060d29] text-slate-400" dir="rtl">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#060d29]" dir="rtl">
      <div className="mb-6">
        <Logo />
      </div>
      <div className="emp-form-card w-full max-w-lg">
        <h1 className="text-lg font-bold text-white mb-1">إكمال بيانات الموظف</h1>
        <p className="text-sm text-slate-400 mb-4">
          مرحباً — أكمل بياناتك للانضمام إلى ZONES. البريد: <span dir="ltr">{invite.email}</span>
        </p>
        <form className="emp-form-page !p-0" onSubmit={submit}>
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
              <label htmlFor="shift">الوردية المفضلة</label>
              <select id="shift" value={form.shift} onChange={set("shift")}>
                {SHIFTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="emp-field">
              <label htmlFor="salary">الراتب المتوقع (د.ل)</label>
              <input id="salary" type="number" min="0" value={form.salary} onChange={set("salary")} />
            </div>
            <div className="emp-field full">
              <label htmlFor="notes">ملاحظات</label>
              <textarea id="notes" value={form.notes} onChange={set("notes")} />
            </div>
          </div>
          <div className="emp-form-actions mt-3">
            <button type="submit" className="emp-btn-primary">
              حفظ البيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
