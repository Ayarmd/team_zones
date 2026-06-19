import TournamentBracketSection from "../../tournaments/components/TournamentBracketSection";

import { RECEPTION_EMPLOYEE_ROUTES } from "../data/receptionEmployeeRoutes";



const RECEPTION_TOURNAMENT_ROUTES = {
  tournaments: RECEPTION_EMPLOYEE_ROUTES.tournaments,
  details: (id) => RECEPTION_EMPLOYEE_ROUTES.tournamentDetails(id),
  participants: (id) => RECEPTION_EMPLOYEE_ROUTES.tournamentParticipants(id),
};

export default function ReceptionTournamentBracketPage() {
  return <TournamentBracketSection routes={RECEPTION_TOURNAMENT_ROUTES} readOnly />;
}


