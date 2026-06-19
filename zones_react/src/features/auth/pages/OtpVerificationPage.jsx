import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../../shared/layouts/AuthLayout";

export default function OtpVerificationPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="تحقق من بريد إلكتروني"
      subtitle="لقد أرسلنا رمز تحقق من 6 أرقام إلى admin@gmail.com"
    >
      <div className="otp-row">
        {Array.from({ length: 6 }).map((_, idx) => (
          <input key={idx} maxLength={1} defaultValue="" className="otp-box" />
        ))}
      </div>
      <button className="primary-btn" onClick={() => navigate("/auth/reset-password")} type="button">
        تحقق من الرمز
      </button>
      <p className="muted center">
        لم يتم إرسال رمز التحقق؟ <Link to="/auth/forgot-password">أعد الإرسال</Link>
      </p>
    </AuthLayout>
  );
}
