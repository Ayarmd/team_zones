import { useCallback, useEffect, useState } from "react";
import {
  AUTH_SESSION_EVENT,
  getAuthSession,
  getUserById,
  PROFILE_UPDATED_EVENT,
} from "../../features/auth/data/mockUsersStorage";

/** حساب المستخدم الحالي فقط — مستقل عن جدول الموظفين */
export function useAccountUser() {
  const read = useCallback(() => {
    const session = getAuthSession();
    if (!session?.id) return null;
    return getUserById(session.id);
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
