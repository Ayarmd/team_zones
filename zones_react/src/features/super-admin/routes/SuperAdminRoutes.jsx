import { Navigate, Route, Routes } from "react-router-dom";
import SuperAdminProtectedRoute from "../components/SuperAdminProtectedRoute";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import { SUPER_ADMIN_ROUTES } from "../data/superAdminConstants";
import SuperAdminDashboardPage from "../pages/SuperAdminDashboardPage";
import PendingRequestsPage from "../pages/PendingRequestsPage";
import HallsManagementPage from "../pages/HallsManagementPage";
import HallManagersPage from "../pages/HallManagersPage";
import EmployeesManagementPage from "../pages/EmployeesManagementPage";
import ArchivePage from "../pages/ArchivePage";
import CommissionsPage from "../pages/CommissionsPage";
import SystemSettingsPage from "../pages/SystemSettingsPage";
import AdminProfilePage from "../pages/AdminProfilePage";
import ChangePasswordPage from "../pages/ChangePasswordPage";

export default function SuperAdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Navigate to="/auth/login" replace />} />
      <Route
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminLayout />
          </SuperAdminProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperAdminDashboardPage />} />
        <Route path="pending-requests" element={<PendingRequestsPage />} />
        <Route path="halls" element={<HallsManagementPage />} />
        <Route path="managers" element={<HallManagersPage />} />
        <Route path="employees" element={<EmployeesManagementPage />} />
        <Route path="archive" element={<Navigate to="halls" replace />} />
        <Route path="archive/halls" element={<ArchivePage type="halls" />} />
        <Route path="archive/managers" element={<ArchivePage type="managers" />} />
        <Route path="archive/employees" element={<ArchivePage type="employees" />} />
        <Route path="commissions" element={<CommissionsPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>
      <Route path="*" element={<Navigate to={SUPER_ADMIN_ROUTES.login} replace />} />
    </Routes>
  );
}
