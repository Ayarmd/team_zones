import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AUTH_SESSION_EVENT,
  findUserByEmail,
  getAuthSession,
  getUserById,
  PROFILE_UPDATED_EVENT,
} from "../../features/auth/data/mockUsersStorage";

/** حساب المستخدم الحالي فقط — مستقل عن جدول الموظفين */
export function useAccountUser() {
  const read = useCallback(() => {
    const session = getAuthSession();
    if (!session?.id) return null;
    return getUserById(session.id) ?? findUserByEmail(session.email);
  }, []);

  const [user, setUser] = useState(read);

  useEffect(() => {
    setUser(read());
  }, [read]);

  useEffect(() => {
    const refresh = () => setUser(read());
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);
    window.addEventListener(AUTH_SESSION_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
      window.removeEventListener(AUTH_SESSION_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [read]);

  return user;
}

/** يوجّه تلقائياً لصفحة الدخول إذا لم يُعثر على حساب المستخدم */
export function useRequireAccountUser() {
  const navigate = useNavigate();
  const user = useAccountUser();

  useEffect(() => {
    if (user) return;
    navigate("/auth/login", {
      replace: true,
      state: { from: window.location.pathname },
    });
  }, [user, navigate]);

  return user;
}
