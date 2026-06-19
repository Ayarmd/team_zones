import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import TournamentPerParticipantsSection from "../components/TournamentPerParticipantsSection";

const MANAGER_TOURNAMENT_ROUTES = {
  tournaments: "/tournaments",
  bracket: (id) => `/tournaments/${id}/bracket`,
};

export default function TournamentPerParticipantsPage() {
  return (
    <ManagerLayout>
      <TournamentPerParticipantsSection routes={MANAGER_TOURNAMENT_ROUTES} />
    </ManagerLayout>
  );
}
