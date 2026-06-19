import ManagerLayout from "../../../shared/layouts/ManagerLayout";

import TournamentDetailsSection from "../components/TournamentDetailsSection";



const MANAGER_TOURNAMENT_ROUTES = {
  tournaments: "/tournaments",
  tournamentsData: "/tournaments/data",
  participants: (id) => `/tournaments/${id}/participants`,
  bracket: (id) => `/tournaments/${id}/bracket`,
};



export default function TournamentDetailsPage() {

  return (

    <ManagerLayout>

      <TournamentDetailsSection routes={MANAGER_TOURNAMENT_ROUTES} />

    </ManagerLayout>

  );

}


