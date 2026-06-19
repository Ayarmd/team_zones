import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import AcceptInvitationPage from "./features/auth/pages/AcceptInvitationPage";
import CompleteManagerRegistrationPage from "./features/auth/pages/CompleteManagerRegistrationPage";
import EmployeeReceptionPage from "./features/employees/pages/EmployeeReceptionPage";
import EmployeeReceptionLayout from "./shared/layouts/EmployeeReceptionLayout";
import ReceptionDashboardPage from "./features/employees/pages/ReceptionDashboardPage";
import ReceptionComingSoonPage from "./features/employees/pages/ReceptionComingSoonPage";
import ReceptionCalendarPage from "./features/employees/pages/ReceptionCalendarPage";
import ReceptionBookingsPage from "./features/employees/pages/ReceptionBookingsPage";
import ReceptionSessionPage from "./features/employees/pages/ReceptionSessionPage";
import ReceptionDevicesPage from "./features/employees/pages/ReceptionDevicesPage";
import ReceptionPackagesPage from "./features/employees/pages/ReceptionPackagesPage";
import ReceptionOffersPage from "./features/employees/pages/ReceptionOffersPage";
import ReceptionTournamentsPage from "./features/employees/pages/ReceptionTournamentsPage";
import ReceptionTournamentDataPage from "./features/employees/pages/ReceptionTournamentDataPage";
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
import NetProfitPage from "./features/finance/pages/NetProfitPage";
import OffersPage from "./features/offers/pages/OffersPage";
import TournamentDataPage from "./features/tournaments/pages/TournamentDataPage";
import TournamentBracketPage from "./features/tournaments/pages/TournamentBracketPage";
import TournamentDetailsPage from "./features/tournaments/pages/TournamentDetailsPage";
import TournamentsPage from "./features/tournaments/pages/TournamentsPage";
import TournamentParticipantsPage from "./features/tournaments/pages/TournamentParticipantsPage";
import TournamentPerParticipantsPage from "./features/tournaments/pages/TournamentPerParticipantsPage";
import EmployeesArchivePage from "./features/employees/pages/EmployeesArchivePage";
import MaintenanceEmployeesPage from "./features/employees/pages/MaintenanceEmployeesPage";
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
import CustomerHallServicesPage from "./features/customer/pages/CustomerHallServicesPage";
import ManagerInteractionPage from "./features/interaction/pages/ManagerInteractionPage";
import ManagerDemoPage from "./features/auth/pages/ManagerDemoPage";

function App() {
  return (
    <Routes>
      <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/join" element={<HallJoinPage />} />
      <Route path="/app/hall" element={<CustomerHallServicesPage />} />
      <Route path="/hall/join" element={<Navigate to="/join" replace />} />
      <Route path="/demo/manager" element={<ManagerDemoPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/manager/complete-registration/:token" element={<CompleteManagerRegistrationPage />} />
      <Route path="/employee/reception" element={<EmployeeReceptionLayout />}>
        <Route index element={<ReceptionDashboardPage />} />
        <Route path="reservations" element={<Navigate to="/employee/reception/reservations/calendar" replace />} />
        <Route path="reservations/calendar" element={<ReceptionCalendarPage />} />
        <Route path="reservations/bookings" element={<ReceptionBookingsPage />} />
        <Route path="reservations/session" element={<ReceptionSessionPage />} />
        <Route path="devices" element={<ReceptionDevicesPage />} />
        <Route path="devices/broken" element={<ReceptionDevicesPage />} />
        <Route path="packages" element={<ReceptionPackagesPage />} />
        <Route path="offers" element={<ReceptionOffersPage />} />
        <Route path="tournaments" element={<ReceptionTournamentsPage />} />
        <Route path="tournaments/data" element={<ReceptionTournamentDataPage />} />
        <Route path="tournaments/participants" element={<ReceptionTournamentParticipantsPage />} />
        <Route path="tournaments/:id/participants" element={<ReceptionTournamentPerParticipantsPage />} />
        <Route path="tournaments/:id/bracket" element={<ReceptionTournamentBracketPage />} />
        <Route path="tournaments/:id" element={<ReceptionTournamentDetailsPage />} />
        <Route path="profile" element={<ReceptionEmployeeProfilePage />} />
        <Route path="change-password" element={<ReceptionEmployeeChangePasswordPage />} />
      </Route>
      <Route path="/employee/maintenance" element={<EmployeeMaintenanceLayout />}>
        <Route index element={<MaintenanceDashboardPage />} />
        <Route path="devices" element={<Navigate to="/employee/maintenance/faults" replace />} />
        <Route path="devices/broken" element={<Navigate to="/employee/maintenance/faults" replace />} />
        <Route path="devices/under-maintenance" element={<Navigate to="/employee/maintenance/faults" replace />} />
        <Route path="faults/register" element={<Navigate to="/employee/maintenance/faults" replace />} />
        <Route path="faults/archive" element={<MaintenanceArchivedFaultsPage />} />
        <Route path="faults" element={<MaintenanceFaultsPage />} />
        <Route path="profile" element={<MaintenanceProfilePage />} />
        <Route path="change-password" element={<MaintenanceEmployeeChangePasswordPage />} />
      </Route>
      <Route path="/profile" element={<ManagerProfilePage />} />
      <Route path="/profile/change-password" element={<ManagerChangePasswordPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/otp" element={<OtpVerificationPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/lounge" element={<LoungeManagementPage />} />
      <Route path="/lounge/edit" element={<LoungeEditPage />} />
      <Route path="/devices" element={<DevicesPackagesPage />} />
      <Route path="/packages" element={<DevicesPackagesPage />} />
      <Route path="/hall/archive" element={<HallArchivePage />} />
      <Route path="/interaction" element={<ManagerInteractionPage />} />
      <Route path="/devices-packages" element={<Navigate to="/devices" replace />} />
      <Route path="/faults" element={<ManagerFaultsPage />} />
      <Route path="/faults/archive" element={<ManagerArchivedFaultsPage />} />
      <Route path="/alerts/log" element={<ManagerAlertsLogPage />} />
      <Route path="/alerts/archive" element={<ManagerAlertsArchivePage />} />
      <Route path="/alerts/stop-bookings" element={<ManagerStopBookingsPage />} />
      <Route path="/offers" element={<OffersPage />} />
      <Route path="/emergency" element={<EmergencyManagementPage />} />
      <Route path="/employees/archive" element={<EmployeesArchivePage />} />
      <Route path="/employees/reception" element={<EmployeeReceptionPage />} />
      <Route path="/employees" element={<MaintenanceEmployeesPage />} />
      <Route path="/employees/invite/:token" element={<EmployeeInviteRegisterPage />} />
      <Route path="/employees/new" element={<EmployeeFormPage />} />
      <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
      <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
      <Route path="/finance" element={<Navigate to="/finance/expenses" replace />} />
      <Route path="/finance/revenues" element={<Navigate to="/finance/net-profit?view=revenues" replace />} />
      <Route path="/finance/expenses" element={<ExpensesPage />} />
      <Route path="/finance/net-profit" element={<NetProfitPage />} />
      <Route path="/tournaments" element={<TournamentsPage />} />
      <Route path="/tournaments/data" element={<TournamentDataPage />} />
      <Route path="/tournaments/new" element={<Navigate to="/tournaments/data?add=1" replace />} />
      <Route path="/tournaments/participants" element={<TournamentParticipantsPage />} />
      <Route path="/tournaments/:id/participants" element={<TournamentPerParticipantsPage />} />
      <Route path="/tournaments/:id/bracket" element={<TournamentBracketPage />} />
      <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
    </Routes>
  );
}

export default App;