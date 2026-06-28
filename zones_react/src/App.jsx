import { Navigate, Route, Routes } from "react-router-dom";
import EmployeeLoginPage from "./features/auth/pages/EmployeeLoginPage";
import ManagerLoginPage from "./features/auth/pages/ManagerLoginPage";
import AcceptInvitationPage from "./features/auth/pages/AcceptInvitationPage";
import CompleteManagerRegistrationPage from "./features/auth/pages/CompleteManagerRegistrationPage";
import EmployeesPage from "./features/employees/pages/EmployeesPage";
import EmployeeReceptionLayout from "./shared/layouts/EmployeeReceptionLayout";
import ReceptionDashboardPage from "./features/employees/pages/ReceptionDashboardPage";
import ReceptionComingSoonPage from "./features/employees/pages/ReceptionComingSoonPage";
import ReceptionCalendarPage from "./features/employees/pages/ReceptionCalendarPage";
import ReceptionBookingsPage from "./features/employees/pages/ReceptionBookingsPage";
import ReceptionBannedPage from "./features/employees/pages/ReceptionBannedPage";
import ReceptionSessionPage from "./features/employees/pages/ReceptionSessionPage";
import ReceptionDevicesPage from "./features/employees/pages/ReceptionDevicesPage";
import ReceptionPackagesPage from "./features/employees/pages/ReceptionPackagesPage";
import ReceptionOffersPage from "./features/employees/pages/ReceptionOffersPage";
import ReceptionTournamentsPage from "./features/employees/pages/ReceptionTournamentsPage";
import ReceptionTournamentParticipantsPage from "./features/employees/pages/ReceptionTournamentParticipantsPage";
import ReceptionTournamentPerParticipantsPage from "./features/employees/pages/ReceptionTournamentPerParticipantsPage";
import ReceptionTournamentDetailsPage from "./features/employees/pages/ReceptionTournamentDetailsPage";
import ReceptionTournamentBracketPage from "./features/employees/pages/ReceptionTournamentBracketPage";
import ReceptionEmployeeProfilePage from "./features/employees/pages/ReceptionEmployeeProfilePage";
import ReceptionEmployeeChangePasswordPage from "./features/employees/pages/ReceptionEmployeeChangePasswordPage";
import EmployeeMaintenanceLayout from "./shared/layouts/EmployeeMaintenanceLayout";
import MaintenanceDashboardPage from "./features/employees/pages/MaintenanceDashboardPage";
import MaintenanceFaultsPage from "./features/employees/pages/MaintenanceFaultsPage";
import MaintenanceArchivedFaultsPage from "./features/employees/pages/MaintenanceArchivedFaultsPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import OtpVerificationPage from "./features/auth/pages/OtpVerificationPage";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import LoungeManagementPage from "./features/lounge/pages/LoungeManagementPage";
import LoungeEditPage from "./features/lounge/pages/LoungeEditPage";
import DevicesPackagesPage from "./features/devices-packages/pages/DevicesPackagesPage";
import HallArchivePage from "./features/devices-packages/pages/HallArchivePage";
import EmergencyManagementPage from "./features/emergency/pages/EmergencyManagementPage";
import ExpensesPage from "./features/finance/pages/ExpensesPage";
import PaymentsPage from "./features/finance/pages/PaymentsPage";
import NetProfitPage from "./features/finance/pages/NetProfitPage";
import OffersPage from "./features/offers/pages/OffersPage";
import TournamentBracketPage from "./features/tournaments/pages/TournamentBracketPage";
import TournamentDetailsPage from "./features/tournaments/pages/TournamentDetailsPage";
import TournamentsPage from "./features/tournaments/pages/TournamentsPage";
import TournamentPerParticipantsPage from "./features/tournaments/pages/TournamentPerParticipantsPage";
import TournamentParticipantsPage from "./features/tournaments/pages/TournamentParticipantsPage";
import EmployeesArchivePage from "./features/employees/pages/EmployeesArchivePage";
import ManagerFaultsPage from "./features/employees/pages/ManagerFaultsPage";
import ManagerArchivedFaultsPage from "./features/employees/pages/ManagerArchivedFaultsPage";
import ManagerAlertsLogPage from "./features/alerts/pages/ManagerAlertsLogPage";
import ManagerAlertsArchivePage from "./features/alerts/pages/ManagerAlertsArchivePage";
import ManagerStopBookingsPage from "./features/alerts/pages/ManagerStopBookingsPage";
import EmployeeFormPage from "./features/employees/pages/EmployeeFormPage";
import EmployeeDetailsPage from "./features/employees/pages/EmployeeDetailsPage";
import EmployeeInviteRegisterPage from "./features/employees/pages/EmployeeInviteRegisterPage";
import { ManagerProfilePage } from "./features/profile/pages/ManagerProfilePage";
import ManagerChangePasswordPage from "./features/profile/pages/ManagerChangePasswordPage";
import MaintenanceProfilePage from "./features/profile/pages/MaintenanceProfilePage";
import MaintenanceEmployeeChangePasswordPage from "./features/employees/pages/MaintenanceEmployeeChangePasswordPage";
import SuperAdminRoutes from "./features/super-admin/routes/SuperAdminRoutes";
import HallJoinPage from "./features/hall-join/pages/HallJoinPage";
import CustomerHallsListingPage from "./features/customer/pages/CustomerHallsListingPage";
import CustomerHallDetailsPage from "./features/customer/pages/CustomerHallDetailsPage";
import ManagerInteractionPage from "./features/interaction/pages/ManagerInteractionPage";
import ManagerDemoPage from "./features/auth/pages/ManagerDemoPage";
import ManagerLayout from "./shared/layouts/ManagerLayout";
import RoleProtectedRoute from "./shared/components/RoleProtectedRoute";
import LegacyManagerRedirect from "./shared/components/LegacyManagerRedirect";
import { ManagerWorkspaceProvider } from "./shared/tenant/ManagerWorkspaceProvider";
import { EmployeeWorkspaceProvider } from "./shared/tenant/EmployeeWorkspaceProvider";
import EmployeeLegacyRedirect from "./shared/components/EmployeeLegacyRedirect";
import {
  MaintenanceFaultsRedirect,
  ReceptionReservationsRedirect,
} from "./shared/components/EmployeeSegmentRedirect";

function App() {
  return (
    <Routes>
      <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
      <Route path="/" element={<Navigate to="/manager/login" replace />} />
      <Route path="/join" element={<HallJoinPage />} />
      <Route path="/app/halls" element={<CustomerHallsListingPage />} />
      <Route path="/app/halls/:stationId" element={<CustomerHallDetailsPage />} />
      <Route path="/app/hall" element={<Navigate to="/app/halls" replace />} />
      <Route path="/hall/join" element={<Navigate to="/join" replace />} />
      <Route path="/demo/manager" element={<ManagerDemoPage />} />
      <Route path="/manager/login" element={<ManagerLoginPage />} />
      <Route path="/auth/login" element={<Navigate to="/manager/login" replace />} />
      <Route path="/employee/login" element={<EmployeeLoginPage />} />
      <Route path="/auth/employee/login" element={<Navigate to="/employee/login" replace />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/manager/complete-registration/:token" element={<CompleteManagerRegistrationPage />} />
      {/* رابط دعوة الموظف عام (قبل تسجيل الدخول) */}
      <Route path="/employees/invite/:token" element={<EmployeeInviteRegisterPage />} />
      <Route path="/employee/reception" element={<EmployeeLegacyRedirect role="reception" />} />
      <Route
        path="/employee/reception/:employeeId"
        element={
          <RoleProtectedRoute roles={["reception"]}>
            <EmployeeWorkspaceProvider role="reception" />
          </RoleProtectedRoute>
        }
      >
        <Route element={<EmployeeReceptionLayout />}>
          <Route index element={<ReceptionDashboardPage />} />
          <Route path="reservations" element={<ReceptionReservationsRedirect />} />
          <Route path="reservations/calendar" element={<ReceptionCalendarPage />} />
          <Route path="reservations/bookings" element={<ReceptionBookingsPage />} />
          <Route path="reservations/banned" element={<ReceptionBannedPage />} />
          <Route path="reservations/session" element={<ReceptionSessionPage />} />
          <Route path="devices" element={<ReceptionDevicesPage />} />
          <Route path="devices/broken" element={<Navigate to="../devices" replace />} />
          <Route path="packages" element={<ReceptionPackagesPage />} />
          <Route path="offers" element={<ReceptionOffersPage />} />
          <Route path="tournaments" element={<ReceptionTournamentsPage />} />
          <Route path="tournaments/data" element={<Navigate to="../tournaments" replace />} />
          <Route path="tournaments/participants" element={<ReceptionTournamentParticipantsPage />} />
          <Route path="tournaments/:id/participants" element={<ReceptionTournamentPerParticipantsPage />} />
          <Route path="tournaments/:id/bracket" element={<ReceptionTournamentBracketPage />} />
          <Route path="tournaments/:id" element={<ReceptionTournamentDetailsPage />} />
          <Route path="profile" element={<ReceptionEmployeeProfilePage />} />
          <Route path="change-password" element={<ReceptionEmployeeChangePasswordPage />} />
        </Route>
      </Route>
      <Route path="/employee/maintenance" element={<EmployeeLegacyRedirect role="maintenance" />} />
      <Route
        path="/employee/maintenance/:employeeId"
        element={
          <RoleProtectedRoute roles={["maintenance"]}>
            <EmployeeWorkspaceProvider role="maintenance" />
          </RoleProtectedRoute>
        }
      >
        <Route element={<EmployeeMaintenanceLayout />}>
          <Route index element={<MaintenanceDashboardPage />} />
          <Route path="devices" element={<MaintenanceFaultsRedirect />} />
          <Route path="devices/broken" element={<MaintenanceFaultsRedirect />} />
          <Route path="devices/under-maintenance" element={<MaintenanceFaultsRedirect />} />
          <Route path="faults/register" element={<MaintenanceFaultsRedirect />} />
          <Route path="faults/archive" element={<MaintenanceArchivedFaultsPage />} />
          <Route path="faults" element={<MaintenanceFaultsPage />} />
          <Route path="profile" element={<MaintenanceProfilePage />} />
          <Route path="change-password" element={<MaintenanceEmployeeChangePasswordPage />} />
        </Route>
      </Route>
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/otp" element={<OtpVerificationPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/manager/:managerId"
        element={
          <RoleProtectedRoute roles={["manager"]}>
            <ManagerWorkspaceProvider />
          </RoleProtectedRoute>
        }
      >
        <Route element={<ManagerLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ManagerProfilePage />} />
        <Route path="profile/change-password" element={<ManagerChangePasswordPage />} />
        <Route path="lounge" element={<LoungeManagementPage />} />
        <Route path="lounge/edit" element={<LoungeEditPage />} />
        <Route path="devices" element={<DevicesPackagesPage />} />
        <Route path="packages" element={<DevicesPackagesPage />} />
        <Route path="hall/archive" element={<HallArchivePage />} />
        <Route path="interaction" element={<ManagerInteractionPage />} />
        <Route path="faults" element={<ManagerFaultsPage />} />
        <Route path="faults/archive" element={<ManagerArchivedFaultsPage />} />
        <Route path="alerts/log" element={<ManagerAlertsLogPage />} />
        <Route path="alerts/archive" element={<ManagerAlertsArchivePage />} />
        <Route path="alerts/stop-bookings" element={<ManagerStopBookingsPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="emergency" element={<EmergencyManagementPage />} />
        <Route path="employees/archive" element={<EmployeesArchivePage />} />
        <Route path="employees/reception" element={<Navigate to="../employees" replace />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/new" element={<EmployeeFormPage />} />
        <Route path="employees/:id/edit" element={<EmployeeFormPage />} />
        <Route path="employees/:id" element={<EmployeeDetailsPage />} />
        <Route path="finance" element={<Navigate to="finance/expenses" replace />} />
        <Route path="finance/revenues" element={<Navigate to="finance/net-profit?view=revenues" replace />} />
        <Route path="finance/expenses" element={<ExpensesPage />} />
        <Route path="finance/payments" element={<PaymentsPage />} />
        <Route path="finance/net-profit" element={<NetProfitPage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="tournaments/data" element={<Navigate to="../tournaments" replace />} />
        <Route path="tournaments/new" element={<Navigate to="../tournaments?add=1" replace />} />
        <Route path="tournaments/participants" element={<TournamentParticipantsPage />} />
        <Route path="tournaments/:id/participants" element={<TournamentPerParticipantsPage />} />
        <Route path="tournaments/:id/bracket" element={<TournamentBracketPage />} />
        <Route path="tournaments/:id" element={<TournamentDetailsPage />} />
        </Route>
      </Route>
      <Route path="/profile" element={<LegacyManagerRedirect />} />
      <Route path="/profile/change-password" element={<LegacyManagerRedirect />} />
      <Route path="/dashboard" element={<LegacyManagerRedirect />} />
      <Route path="/lounge" element={<LegacyManagerRedirect />} />
      <Route path="/lounge/edit" element={<LegacyManagerRedirect />} />
      <Route path="/devices" element={<LegacyManagerRedirect />} />
      <Route path="/packages" element={<LegacyManagerRedirect />} />
      <Route path="/hall/archive" element={<LegacyManagerRedirect />} />
      <Route path="/interaction" element={<LegacyManagerRedirect />} />
      <Route path="/devices-packages" element={<LegacyManagerRedirect segment="devices" />} />
      <Route path="/faults" element={<LegacyManagerRedirect />} />
      <Route path="/faults/archive" element={<LegacyManagerRedirect />} />
      <Route path="/alerts/log" element={<LegacyManagerRedirect />} />
      <Route path="/alerts/archive" element={<LegacyManagerRedirect />} />
      <Route path="/alerts/stop-bookings" element={<LegacyManagerRedirect />} />
      <Route path="/offers" element={<LegacyManagerRedirect />} />
      <Route path="/emergency" element={<LegacyManagerRedirect />} />
      <Route path="/employees/archive" element={<LegacyManagerRedirect />} />
      <Route path="/employees/reception" element={<LegacyManagerRedirect />} />
      <Route path="/employees/new" element={<LegacyManagerRedirect />} />
      <Route path="/employees/:id/edit" element={<LegacyManagerRedirect />} />
      <Route path="/employees/:id" element={<LegacyManagerRedirect />} />
      <Route path="/employees" element={<LegacyManagerRedirect />} />
      <Route path="/finance" element={<LegacyManagerRedirect />} />
      <Route path="/finance/revenues" element={<LegacyManagerRedirect />} />
      <Route path="/finance/expenses" element={<LegacyManagerRedirect />} />
      <Route path="/finance/net-profit" element={<LegacyManagerRedirect />} />
      <Route path="/tournaments" element={<LegacyManagerRedirect />} />
      <Route path="/tournaments/data" element={<LegacyManagerRedirect segment="tournaments" />} />
      <Route path="/tournaments/new" element={<LegacyManagerRedirect segment="tournaments?add=1" />} />
      <Route path="/tournaments/participants" element={<LegacyManagerRedirect segment="tournaments" />} />
      <Route path="/tournaments/:id/participants" element={<LegacyManagerRedirect />} />
      <Route path="/tournaments/:id/bracket" element={<LegacyManagerRedirect />} />
      <Route path="/tournaments/:id" element={<LegacyManagerRedirect />} />    </Routes>
  );
}

export default App;