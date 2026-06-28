import { useParams } from "react-router-dom";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import { buildReceptionWorkspacePath } from "../../auth/data/accountSessionStorage";
import { useEmployeeWorkspaceOptional } from "../../../shared/tenant/EmployeeWorkspaceProvider";

export function getReceptionEmployeeRoutes(employeeId) {
  const base = `/employee/reception/${employeeId}`;
  return {
    dashboard: base,
    reservations: `${base}/reservations`,
    reservationsCalendar: `${base}/reservations/calendar`,
    reservationsBookings: `${base}/reservations/bookings`,
    reservationsBanned: `${base}/reservations/banned`,
    reservationsSession: `${base}/reservations/session`,
    devices: `${base}/devices`,
    devicesBroken: `${base}/devices/broken`,
    packages: `${base}/packages`,
    offers: `${base}/offers`,
    tournaments: `${base}/tournaments`,
    tournamentsData: `${base}/tournaments/data`,
    tournamentsParticipants: `${base}/tournaments/participants`,
    tournamentParticipants: (id) => `${base}/tournaments/${id}/participants`,
    tournamentDetails: (id) => `${base}/tournaments/${id}`,
    tournamentBracket: (id) => `${base}/tournaments/${id}/bracket`,
    profile: `${base}/profile`,
    changePassword: `${base}/change-password`,
  };
}

export function useReceptionEmployeeRoutes() {
  const ctx = useEmployeeWorkspaceOptional();
  const { employeeId } = useParams();
  const id = ctx?.employeeId ?? employeeId ?? getAuthSession()?.id ?? "0";
  return {
    routes: getReceptionEmployeeRoutes(id),
    employeeId: id,
    buildPath: (segment) => buildReceptionWorkspacePath(id, segment),
  };
}

/** للتوافق — يُفضّل useReceptionEmployeeRoutes() */
export const RECEPTION_EMPLOYEE_ROUTES = getReceptionEmployeeRoutes(
  typeof window !== "undefined"
    ? getAuthSession()?.id ?? "0"
    : "0",
);
