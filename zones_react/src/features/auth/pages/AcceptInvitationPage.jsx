import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Phone, User } from "lucide-react";
import AuthLayout from "../../../shared/layouts/AuthLayout";
import { roleLabel, shiftLabel } from "../../employees/data/employeeMeta";
import { clearPendingInvite, getPendingInvite } from "../../employees/data/pendingInviteStorage";
import { loadEmployees, nextEmployeeId, saveEmployees } from "../../employees/data/employeesStorage";
import { registerEmployeeUser } from "../data/mockUsersStorage";
import "./AcceptInvitationPage.css";

export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const pending = getPendingInvite();
    if (!pending) {
      navigate("/auth/login", { replace: true });
      return;
    }
    setInvite(pending);
  }, [navigate]);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!invite) return;

    const name = fullName.trim();
    const phoneVal = phone.trim();
    if (!name || !phoneVal) {
      setError("الاسم ورقم الهاتف مطلوبان.");
      return;
    }
    if (!password || password.length < 4) {
      setError("أدخل كلمة مرور (4 أحرف على الأقل).");
      return;
    }

    const list = loadEmployees();
    const employeeId = nextEmployeeId(list);
    saveEmployees([
      ...list,
      {
        id: employeeId,
        fullName: name,
        phone: phoneVal,
        email: invite.email,
        role: invite.role,
        shift: invite.shift,
        status: "working",
        hireDate: new Date().toISOString().slice(0, 10),
        salary: 0,
        notes: "حساب من دعوة المدير",
        hoursThisMonth: 0,
        shiftsThisMonth: 0,
      },
    ]);

    const reg = registerEmployeeUser({
      email: invite.email,
      password,
      fullName: name,
      role: invite.role,
      employeeId,
    });

    if (!reg.ok) {
      setError(reg.error || "تعذر إنشاء الحساب.");
      return;
    }

    clearPendingInvite();
    navigate("/auth/login", {
      replace: true,
      state: {
        registeredEmail: invite.email,
        message: "تم إنشاء حسابك. سجّل الدخول بالبريد وكلمة المرور التي اخترتها.",
      },
    });
  };

  if (!invite) {
    return (
      <main className="auth-page" dir="rtl">
        <p className="muted text-center">جاري التحميل...</p>
      </main>
    );
  }

  return (
    <AuthLayout title="إنشاء حساب الموظف" subtitle="أكمل بياناتك للانضمام إلى ZONES">
      <div className="accept-invite-meta">
        <p>
          الوظيفة: <strong>{roleLabel(invite.role)}</strong> · الوردية:{" "}
          <strong>{shiftLabel(invite.shift)}</strong>
        </p>
        <p className="accept-invite-meta__note">حددها الإدارة — لا يمكن تغييرها من هنا.</p>
      </div>

      <form className="form-grid accept-invite-form" onSubmit={submit}>
        <label>البريد الإلكتروني</label>
        <div className="field field--readonly">
          <input type="email" value={invite.email} readOnly dir="ltr" aria-readonly />
        </div>

        <label>الاسم الكامل</label>
        <div className="field">
          <User size={18} />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="الاسم كما في الهوية"
            required
          />
        </div>

        <label>رقم الهاتف</label>
        <div className="field">
          <Phone size={18} />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+218 ..."
            dir="ltr"
            required
          />
        </div>

        <label>كلمة المرور</label>
        <div className="field">
          <Lock size={18} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="اختر كلمة مرور للدخول"
            minLength={4}
            required
          />
        </div>

        {error ? <p className="accept-invite-error">{error}</p> : null}

        <button className="primary-btn" type="submit">
          إرسال وإنشاء الحساب
        </button>

        <Link className="inline-link" to="/auth/login">
          لديك حساب؟ تسجيل الدخول
        </Link>
      </form>
    </AuthLayout>
  );
}
