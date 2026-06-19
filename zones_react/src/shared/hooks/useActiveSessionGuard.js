import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAccountBlockCode,
  LOGIN_BLOCK_CODES,
  LOGIN_BLOCK_MESSAGES,
} from "../../features/auth/data/accountAccess";
import {
  clearAuthSession,
  getAuthSession,
  getUserById,
} from "../../features/auth/data/mockUsersStorage";

/** يخرج المستخدم إذا عُطّل حسابه أو صالة مديره من لوحة الأدمن */
export default function useActiveSessionGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.id) return;

    const user = getUserById(session.id);
    const blockCode = getAccountBlockCode(user);
    if (!blockCode) return;

    clearAuthSession();
    const message =
      blockCode === LOGIN_BLOCK_CODES.MANAGER_DISABLED
        ? LOGIN_BLOCK_MESSAGES[LOGIN_BLOCK_CODES.MANAGER_DISABLED]
        : LOGIN_BLOCK_MESSAGES[LOGIN_BLOCK_CODES.EMPLOYEE_DISABLED];

    navigate("/auth/login", { replace: true, state: { loginError: message } });
  }, [navigate]);
}
