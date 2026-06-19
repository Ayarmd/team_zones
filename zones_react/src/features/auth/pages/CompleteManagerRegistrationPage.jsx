import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Building2, Eye, EyeOff, Lock, Phone, User } from "lucide-react";
import AuthLayout from "../../../shared/layouts/AuthLayout";
import { completeManagerRegistration } from "../../super-admin/data/superAdminStorage";
import { getInviteByToken } from "../../super-admin/data/hallManagerInvitesStorage";
import { authenticateUser, setAuthSession } from "../data/mockUsersStorage";

export default function CompleteManagerRegistrationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const data = getInviteByToken(token);
    if (!data) {
      setLoadError("رابط غير صالح أو منتهي الصلاحية.");
      return;
    }
    if (data.alreadyUsed) {
      setLoadError("تم استخدام هذا الرابط مسبقاً. يمكنك تسجيل الدخول مباشرة.");
      return;
    }
    if (data.expired) {
      setLoadError("انتهت صلاحية الرابط (24 ساعة). تواصل مع إدارة المنصة.");
      return;
    }
    setInvite(data);
    setFullName(data.managerName || "");
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!invite) return;

    if (!fullName.trim() || !phone.trim()) {
      setError("الاسم ورقم الهاتف مطلوبان.");
      return;
    }
    if (!password || password.length < 4) {
      setError("كلمة المرور (4 أحرف على الأقل).");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمة المرور وتأكيدها غير متطابقين.");
      return;
    }

    setSubmitting(true);
    const result = completeManagerRegistration(token, {
      fullName: fullName.trim(),
      password,
      phone: phone.trim(),
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || "تعذر إنشاء الحساب.");
      return;
    }

    const session = authenticateUser(invite.email, password);
    if (session) setAuthSession(session);

    navigate("/dashboard", {
      replace: true,
      state: {
        message: `مرحباً ${fullName.trim()}! تم تفعيل حساب مدير صالة ${invite.hallName} بنجاح.`,
      },
    });
  };

  if (loadError) {
    return (
      <AuthLayout title="رابط غير صالح" subtitle="إكمال تسجيل مدير الصالة">
        <p className="accept-invite-error text-center">{loadError}</p>
        <Link className="primary-btn mt-4 block text-center" to="/auth/login">
          الذهاب لتسجيل الدخول
        </Link>
      </AuthLayout>
    );
  }

  if (!invite) {
    return (
      <main className="auth-page" dir="rtl">
        <p className="muted text-center">جاري التحميل...</p>
      </main>
    );
  }

  return (
    <AuthLayout
      title="إكمال التسجيل"
      subtitle="أنشئ حساب مدير الصالة للدخول إلى منصة ZONES"
    >
      <div className="accept-invite-meta mb-4">
        <p className="flex items-center justify-center gap-2">
          <Building2 size={16} />
          <strong>{invite.hallName}</strong>
        </p>
        <p className="accept-invite-meta__note text-center">
          الرابط صالح لمدة 24 ساعة من لحظة إرسال الدعوة
        </p>
      </div>

      <form className="form-grid accept-invite-form" onSubmit={submit}>
        <label>البريد الإلكتروني</label>
        <div className="field field--readonly">
          <input type="email" value={invite.email} readOnly dir="ltr" aria-readonly />
        </div>

        <label>الاسم</label>
        <div className="field">
          <User size={18} />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="الاسم الكامل"
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
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="اختر كلمة مرور"
            minLength={4}
            required
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowPass((v) => !v)}
            aria-label="إظهار كلمة المرور"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <label>تأكيد كلمة المرور</label>
        <div className="field">
          <Lock size={18} />
          <input
            type={showPass ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="أعد إدخال كلمة المرور"
            minLength={4}
            required
          />
        </div>

        {error ? <p className="accept-invite-error">{error}</p> : null}

        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? "جاري الإنشاء..." : "إنشاء الحساب"}
        </button>

        <Link className="inline-link" to="/auth/login">
          لديك حساب؟ تسجيل الدخول
        </Link>
      </form>
    </AuthLayout>
  );
}
