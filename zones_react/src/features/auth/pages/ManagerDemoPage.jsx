import { Navigate } from "react-router-dom";
import { loadMockUsers, setAuthSession } from "../../auth/data/mockUsersStorage";

/** دخول تجريبي للمدير — للعرض بدون صفحة login */
export default function ManagerDemoPage() {
  const manager = loadMockUsers().find((u) => u.role === "manager");
  if (manager) setAuthSession(manager);
  return <Navigate to="/dashboard" replace />;
}
