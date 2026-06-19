import ManagerLayout from "../../../shared/layouts/ManagerLayout";

import TournamentBracketSection from "../components/TournamentBracketSection";



const MANAGER_TOURNAMENT_ROUTES = {
  tournaments: "/tournaments",
  details: (id) => `/tournaments/${id}`,
  participants: (id) => `/tournaments/${id}/participants`,
};



export default function TournamentBracketPage() {

  return (

    <ManagerLayout>

      <TournamentBracketSection routes={MANAGER_TOURNAMENT_ROUTES} />

    </ManagerLayout>

  );

}


