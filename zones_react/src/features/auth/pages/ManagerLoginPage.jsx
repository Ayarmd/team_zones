import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import AuthLayout from "../../../shared/layouts/AuthLayout";
import AuthMessage from "../components/AuthMessage";
import { EMPLOYEE_LOGIN_PATH, MANAGER_LOGIN_PATH } from "../data/authRoutes";
import { getLoginRedirectPath } from "../data/mockUsersStorage";
import { loginManager } from "../data/managerAuth";
import { normalizeGmailEmail } from "../../../shared/utils/normalizeGmailEmail";
import { clearSuperAdminSession } from "../../super-admin/data/superAdminAuth";
import { fetchLoungesCatalog } from "../../customer/data/loungeCatalogApi";

export default function ManagerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hallId, setHallId] = useState("");
  const [hallOptions, setHallOptions] = useState([]);
  const [hallsLoading, setHallsLoading] = useState(true);
  const [hallsError, setHallsError] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadHalls = async () => {
      setHallsLoading(true);
      setHallsError("");
      const result = await fetchLoungesCatalog();
      if (cancelled) return;

      if (!result.ok) {
        setHallOptions([]);
        setHallsError(result.error || "تعذر تحميل الصالات من الخادم.");
        setHallsLoading(false);
        return;
      }

      setHallOptions(
        result.lounges.map((lounge) => ({
          value: lounge.id,
          label: lounge.name || lounge.hallName,
        })),
      );
      setHallsLoading(false);
    };

    loadHalls();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!hallId) {
      setError("اختر الصالة التي تتبع لها.");
      return;
    }

    setSubmitting(true);

    const normalizedEmail = normalizeGmailEmail(email);
    const apiResult = await loginManager({
      email: normalizedEmail,
      password,
      stationId: hallId,
    });

    setSubmitting(false);

    if (!apiResult.ok) {
      setError(apiResult.error || "تعذر تسجيل الدخول.");
      return;
    }

    clearSuperAdminSession();

    const from = location.state?.from;
    const fallback = apiResult.redirectPath || getLoginRedirectPath("manager", apiResult.user?.id);
    const target =
      typeof from === "string" && from.startsWith("/manager/") && !from.startsWith("/auth")
        ? from
        : fallback;
    navigate(target, { replace: true });
  };

  return (
    <AuthLayout
      centered
      title="دخول المدير"
      subtitle="مدير تابع لصالة — اختر صالتك ثم سجّل الدخول"
    >
      <form className="mx-auto w-full max-w-sm space-y-5" onSubmit={submit}>
        {info ? <AuthMessage tone="info">{info}</AuthMessage> : null}
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
        {hallsError ? <AuthMessage tone="error">{hallsError}</AuthMessage> : null}

        <div className="space-y-2">
          <Label htmlFor="manager-login-email" className="text-[11px] text-gray-500 dark:text-gray-400">
            البريد الإلكتروني
          </Label>
          <Input
            id="manager-login-email"
            type="email"
            dir="ltr"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-gray-50 dark:bg-gray-800/80"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="manager-login-password"
              className="text-[11px] text-gray-500 dark:text-gray-400"
            >
              كلمة المرور
            </Label>
            <Link
              className="text-[11px] font-semibold text-[#6B5478] transition hover:text-[#5a4668] hover:underline"
              to="/auth/forgot-password"
              state={{ returnTo: MANAGER_LOGIN_PATH }}
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
          <PasswordInput
            id="manager-login-password"
            value={password}
            onChange={setPassword}
            inputClassName="h-11 bg-gray-50 dark:bg-gray-800/80"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] text-gray-500 dark:text-gray-400">الصالة (تابع لصالة)</Label>
          <Select
            value={hallId}
            onValueChange={setHallId}
            options={hallOptions}
            placeholder={hallsLoading ? "جاري تحميل الصالات..." : "اختر الصالة"}
            disabled={hallsLoading || hallOptions.length === 0}
            triggerClassName="h-11 bg-gray-50 dark:bg-gray-800/80"
          />
          {!hallsLoading && hallOptions.length === 0 ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              لا توجد صالات متاحة — تأكد أن Laravel يعمل.
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full text-sm"
          disabled={submitting || hallsLoading || hallOptions.length === 0}
        >
          {submitting ? "جاري الدخول..." : "تسجيل الدخول"}
        </Button>

        <p className="text-center text-[11px] text-gray-500 dark:text-gray-400">
          موظف استقبال أو صيانة؟{" "}
          <Link to={EMPLOYEE_LOGIN_PATH} className="font-bold text-[#6B5478] hover:underline">
            دخول الموظفين
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
