import { Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../../shared/layouts/AuthLayout";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="إعادة تعيين كلمة المرور"
      subtitle="قم بإنشاء كلمة مرور جديدة وآمنة لحسابك"
      backLink={
        <Link className="ghost-link" to="/auth/login">
          العودة لتسجيل الدخول
        </Link>
      }
    >
      <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
        <label>كلمة المرور الجديدة</label>
        <div className="field">
          <Lock size={18} />
          <input type="password" placeholder="••••••••" />
        </div>

        <label>تأكيد كلمة المرور الجديدة</label>
        <div className="field">
          <Lock size={18} />
          <input type="password" placeholder="••••••••" />
        </div>
        <button className="primary-btn" onClick={() => navigate("/auth/login")} type="submit">
          حفظ كلمة المرور
        </button>
      </form>
    </AuthLayout>
  );
}
