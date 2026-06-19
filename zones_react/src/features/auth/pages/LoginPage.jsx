import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import AuthLayout from "../../../shared/layouts/AuthLayout";
import { attemptLogin, LOGIN_BLOCK_MESSAGES } from "../data/accountAccess";
import { clearAuthSession, getLoginRedirectPath, setAuthSession } from "../data/mockUsersStorage";
import {
  clearSuperAdminSession,
  setSuperAdminSession,
} from "../../super-admin/data/superAdminAuth";
import { SUPER_ADMIN_ROUTES } from "../../super-admin/data/superAdminConstants";

function AuthMessage({ tone, children }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-xs font-semibold leading-relaxed",
        tone === "error"
          ? "border-red-200/80 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          : "border-[#6B5478]/25 bg-[#6B5478]/10 text-[#6B5478] dark:border-[#6B5478]/35 dark:bg-[#6B5478]/15 dark:text-[#d4c4de]",
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const state = location.state;
    if (state?.registeredEmail) {
      setEmail(state.registeredEmail);
    }
    if (state?.loginError) {
      setError(state.loginError);
    } else if (state?.message) {
      setInfo(state.message);
    }
  }, [location.state]);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const result = attemptLogin(email, password);
    if (!result.ok) {
      setError(LOGIN_BLOCK_MESSAGES[result.code] || LOGIN_BLOCK_MESSAGES.invalid);
      return;
    }

    const from = location.state?.from;

    if (result.accountType === "super_admin") {
      clearAuthSession();
      setSuperAdminSession(result.user);
      const target =
        typeof from === "string" && from.startsWith("/super-admin") ? from : SUPER_ADMIN_ROUTES.dashboard;
      navigate(target, { replace: true });
      return;
    }

    clearSuperAdminSession();
    setAuthSession(result.user);
    const fallback = getLoginRedirectPath(result.user.role);
    const target =
      typeof from === "string" && from.startsWith("/") && !from.startsWith("/auth") ? from : fallback;
    navigate(target, { replace: true });
  };

  return (
    <AuthLayout centered title="تسجيل الدخول" subtitle="مرحباً بعودتك إلى ZONES">
      <form className="mx-auto w-full max-w-sm space-y-5" onSubmit={submit}>
        {info ? <AuthMessage tone="info">{info}</AuthMessage> : null}
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}

        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-[11px] text-gray-500 dark:text-gray-400">
            البريد الإلكتروني
          </Label>
          <Input
            id="login-email"
            type="email"
            dir="ltr"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-gray-50 dark:bg-gray-800/80"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="login-password" className="text-[11px] text-gray-500 dark:text-gray-400">
              كلمة المرور
            </Label>
            <Link
              className="text-[11px] font-semibold text-[#6B5478] transition hover:text-[#5a4668] hover:underline"
              to="/auth/forgot-password"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            value={password}
            onChange={setPassword}
            inputClassName="h-11 bg-gray-50 dark:bg-gray-800/80"
            required
          />
        </div>

        <Button type="submit" size="lg" className="h-11 w-full text-sm">
          تسجيل الدخول
        </Button>
      </form>
    </AuthLayout>
  );
}
