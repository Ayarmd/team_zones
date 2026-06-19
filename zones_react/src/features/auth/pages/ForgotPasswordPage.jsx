import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../../shared/layouts/AuthLayout";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="استرجاع كلمة المرور"
      subtitle="أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق"
    >
      <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
        <label>البريد الإلكتروني</label>
        <div className="field">
          <Mail size={18} />
          <input type="email" placeholder="admin@zones.com" />
        </div>
        <button className="primary-btn" onClick={() => navigate("/auth/otp")} type="submit">
          إرسال رمز التحقق
        </button>
      </form>
    </AuthLayout>
  );
}
