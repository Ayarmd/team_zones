import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../../shared/layouts/AuthLayout";

/**
 * Legacy route — employee registration is handled via `/employees/invite/:token` (Laravel API).
 */
export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim();

  useEffect(() => {
    if (token) {
      navigate(`/employees/invite/${encodeURIComponent(token)}`, { replace: true });
      return;
    }
    navigate("/manager/login", {
      replace: true,
      state: {
        message: "استخدم رابط الدعوة المرسل إلى بريدك الإلكتروني لإكمال التسجيل.",
      },
    });
  }, [navigate, token]);

  return (
    <AuthLayout title="دعوة الموظف" subtitle="جاري التوجيه...">
      <p className="muted text-center">جاري التحميل...</p>
    </AuthLayout>
  );
}
