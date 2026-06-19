import TournamentPerParticipantsSection from "../../tournaments/components/TournamentPerParticipantsSection";
import { RECEPTION_EMPLOYEE_ROUTES } from "../data/receptionEmployeeRoutes";

const RECEPTION_TOURNAMENT_ROUTES = {
  tournaments: RECEPTION_EMPLOYEE_ROUTES.tournaments,
  bracket: (id) => RECEPTION_EMPLOYEE_ROUTES.tournamentBracket(id),
};

export default function ReceptionTournamentPerParticipantsPage() {
  return <TournamentPerParticipantsSection routes={RECEPTION_TOURNAMENT_ROUTES} readOnly />;
}
