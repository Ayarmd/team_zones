import { Navigate, useLocation } from "react-router-dom";
import { getSuperAdminSession } from "../data/superAdminAuth";
import { SUPER_ADMIN_ROUTES } from "../data/superAdminConstants";

export default function SuperAdminProtectedRoute({ children }) {
  const location = useLocation();
  const session = getSuperAdminSession();
  if (!session) {
    return <Navigate to={SUPER_ADMIN_ROUTES.login} replace state={{ from: location.pathname }} />;
  }
  return children;
}
