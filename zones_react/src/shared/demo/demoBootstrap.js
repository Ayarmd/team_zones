import { loadMockUsers } from "../../features/auth/data/mockUsersStorage";
import { loadAlerts, saveAlerts } from "../../features/alerts/data/managerAlertsStorage";
import { loadDevices, saveDevices } from "../../features/devices-packages/data/devicesStorage";
import {
  loadDeviceSessions,
  saveDeviceSessions,
} from "../../features/devices-packages/data/deviceSessionsStorage";
import {
  loadPackageBookings,
  savePackageBookings,
} from "../../features/devices-packages/data/packageBookingsStorage";
import { loadPackages, savePackages } from "../../features/devices-packages/data/packagesStorage";
import { loadEmployees, saveEmployees } from "../../features/employees/data/employeesStorage";
import {
  loadCalendarSlots,
  saveCalendarSlots,
} from "../../features/employees/data/receptionCalendarStorage";
import { loadExpenses, saveExpenses } from "../../features/finance/data/expensesStorage";
import { loadManagerHall } from "../../features/lounge/data/managerHallStorage";
import { loadFaults, saveFaults } from "../../features/maintenance/data/maintenanceFaultsStorage";
import { loadOffers, saveOffers } from "../../features/offers/data/offersStorage";
import { loadComments, saveComments } from "../../features/interaction/data/customerCommentsStorage";
import {
  loadOfferBookings,
  saveOfferBookings,
} from "../../features/offers/data/offerBookingsStorage";
import { ensureSuperAdminDataPersisted } from "../../features/super-admin/data/superAdminStorage";
import {
  loadTournamentParticipants,
  saveTournamentParticipants,
} from "../../features/tournaments/data/tournamentParticipantsStorage";
import {
  loadTournamentRows,
  saveTournamentRows,
  TOURNAMENTS_LIST_KEY,
} from "../../features/tournaments/tournamentsListStorage";
import { ensureListPersisted } from "../storage/storageHelpers";

export const DEMO_BOOTSTRAP_VERSION = "2026.06.08";
const VERSION_KEY = "zones-demo-bootstrap-v1";
const LEGACY_TOURNAMENTS_SESSION_KEY = "zones-tournaments-list-v1";

function migrateTournamentsFromSessionStorage() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(TOURNAMENTS_LIST_KEY)) return;
  const legacy = sessionStorage.getItem(LEGACY_TOURNAMENTS_SESSION_KEY);
  if (legacy) {
    localStorage.setItem(TOURNAMENTS_LIST_KEY, legacy);
    sessionStorage.removeItem(LEGACY_TOURNAMENTS_SESSION_KEY);
  }
}

/** يزرع ويحفظ كل بيانات العرض — لا يمسّ البيانات الموجودة غير الفارغة */
export function runDemoBootstrap() {
  if (typeof window === "undefined") return;

  loadManagerHall();
  loadMockUsers();
  migrateTournamentsFromSessionStorage();

  ensureListPersisted("zones-employees", loadEmployees, saveEmployees);
  ensureListPersisted("zones-devices-v2", loadDevices, saveDevices);
  ensureListPersisted("zones-packages-v1", loadPackages, savePackages);
  ensureListPersisted("zones-offers-v1", loadOffers, saveOffers);
  ensureListPersisted("zones-hall-expenses-v1", loadExpenses, saveExpenses);
  ensureListPersisted("zones-maintenance-faults-v5", loadFaults, saveFaults);
  ensureListPersisted("zones-reception-calendar-v1", loadCalendarSlots, saveCalendarSlots);
  ensureListPersisted("zones-manager-alerts-v1", loadAlerts, saveAlerts);
  ensureListPersisted(TOURNAMENTS_LIST_KEY, loadTournamentRows, saveTournamentRows);
  ensureListPersisted(
    "zones-tournament-participants-v1",
    loadTournamentParticipants,
    saveTournamentParticipants,
  );
  ensureListPersisted("zones-device-sessions-v1", loadDeviceSessions, saveDeviceSessions);
  ensureListPersisted("zones-package-bookings-v1", loadPackageBookings, savePackageBookings);
  ensureListPersisted("zones-offer-bookings-v1", loadOfferBookings, saveOfferBookings);
  ensureListPersisted("zones-customer-comments-v1", loadComments, saveComments);

  ensureSuperAdminDataPersisted();

  localStorage.setItem(VERSION_KEY, DEMO_BOOTSTRAP_VERSION);
}
