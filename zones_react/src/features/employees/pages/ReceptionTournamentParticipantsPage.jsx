import TournamentParticipantsSection from "../../tournaments/components/TournamentParticipantsSection";
import { RECEPTION_EMPLOYEE_ROUTES } from "../data/receptionEmployeeRoutes";

export default function ReceptionTournamentParticipantsPage() {
  return (
    <TournamentParticipantsSection
      getParticipantsPath={(id) => RECEPTION_EMPLOYEE_ROUTES.tournamentParticipants(id)}
    />
  );
}
