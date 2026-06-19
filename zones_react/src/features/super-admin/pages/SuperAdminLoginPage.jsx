import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import ThemeToggle from "../../../shared/components/ThemeToggle";
import { Input } from "../../../components/ui/input";
import {
  authenticateSuperAdmin,
  getSuperAdminLoginRedirect,
  getSuperAdminSession,
  setSuperAdminSession,
} from "../data/superAdminAuth";
import { SUPER_ADMIN_ROUTES } from "../data/superAdminConstants";

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (getSuperAdminSession()) {
    return <Navigate to={getSuperAdminLoginRedirect()} replace />;
  }

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const user = authenticateSuperAdmin(email, password);
    if (!user) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مرة أخرى.");
      return;
    }
    setSuperAdminSession(user);
    const from = location.state?.from;
    const target =
      typeof from === "string" && from.startsWith("/super-admin") ? from : getSuperAdminLoginRedirect();
    navigate(target, { replace: true });
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 via-white to-[#6B5478]/10 p-4 dark:from-gray-950 dark:via-gray-900 dark:to-[#6B5478]/20"
      style={{ fontFamily: "Cairo, 'Segoe UI', Tahoma, sans-serif" }}
      dir="rtl"
    >
      <div className="absolute start-4 top-4">
        <ThemeToggle compact />
      </div>
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-6 text-center">
          <Shield size={28} className="mx-auto mb-3 text-[#6B5478]" />
          <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">تسجيل دخول الأدمن العام</h1>
          <p className="mt-1 text-xs text-gray-500">نظام إدارة الصالات والمجمعات التجارية — ZONES</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600 dark:text-gray-300">البريد الإلكتروني</label>
            <Input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@gmail.com"
              required
              className="font-semibold dark:border-gray-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600 dark:text-gray-300">كلمة المرور</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="font-semibold dark:border-gray-600"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-[#6B5478] py-3 text-sm font-extrabold text-white shadow-lg shadow-[#6B5478]/30 transition hover:bg-[#5a4668]"
          >
            تسجيل الدخول
          </button>
        </form>
        <p className="mt-4 text-center text-[10px] text-gray-400">
          بيانات الدخول الافتراضية: superadmin@gmail.com / 12345678
        </p>
      </div>
    </div>
  );
}
