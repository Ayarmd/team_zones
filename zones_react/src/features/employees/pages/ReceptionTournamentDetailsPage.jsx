import TournamentDetailsSection from "../../tournaments/components/TournamentDetailsSection";

import { RECEPTION_EMPLOYEE_ROUTES } from "../data/receptionEmployeeRoutes";



const RECEPTION_TOURNAMENT_ROUTES = {
  tournaments: RECEPTION_EMPLOYEE_ROUTES.tournaments,
  tournamentsData: RECEPTION_EMPLOYEE_ROUTES.tournamentsData,
  participants: (id) => RECEPTION_EMPLOYEE_ROUTES.tournamentParticipants(id),
  bracket: (id) => RECEPTION_EMPLOYEE_ROUTES.tournamentBracket(id),
};



export default function ReceptionTournamentDetailsPage() {

  return <TournamentDetailsSection routes={RECEPTION_TOURNAMENT_ROUTES} />;

}


