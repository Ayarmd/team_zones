import { Navigate } from "react-router-dom";
import { MANAGER_LOGIN_PATH } from "../data/authRoutes";

/** Demo login disabled — API-only mode */
export default function ManagerDemoPage() {
  return (
    <Navigate
      to={MANAGER_LOGIN_PATH}
      replace
      state={{ loginError: "الدخول التجريبي معطّل. سجّل الدخول عبر API." }}
    />
  );
}
