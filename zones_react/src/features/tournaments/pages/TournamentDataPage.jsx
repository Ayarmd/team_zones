import { useEffect } from "react";

import { useSearchParams } from "react-router-dom";

import ManagerLayout from "../../../shared/layouts/ManagerLayout";

import TournamentDataSection from "../components/TournamentDataSection";



export default function TournamentDataPage() {

  const [searchParams, setSearchParams] = useSearchParams();

  const autoOpenAdd = searchParams.get("add") === "1";



  useEffect(() => {

    if (autoOpenAdd) setSearchParams({}, { replace: true });

  }, [autoOpenAdd, setSearchParams]);



  return (

    <ManagerLayout>

      <TournamentDataSection showAddButton autoOpenAdd={autoOpenAdd} />

    </ManagerLayout>

  );

}


