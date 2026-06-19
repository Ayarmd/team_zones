import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import TournamentsListTable from "../../tournaments/components/TournamentsListTable";
import {
  loadActiveTournamentRows,
  TOURNAMENTS_LIST_EVENT,
} from "../../tournaments/tournamentsListStorage";

const PAGE_SIZE = 5;

export default function ReceptionTournamentsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(() => loadActiveTournamentRows());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const sync = () => setRows(loadActiveTournamentRows());
    window.addEventListener(TOURNAMENTS_LIST_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(TOURNAMENTS_LIST_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name?.includes(q) ||
        r.game?.includes(q) ||
        r.startDate?.includes(q) ||
        r.endDate?.includes(q),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openParticipants = (row) => {
    navigate(`/employee/reception/tournaments/${row.id}/participants`, {
      state: { tournament: row, from: "list" },
    });
  };

  return (
    <div>
      <PageHeader
        title="عرض البطولات"
        description="عرض فقط — إدارة البطولات من لوحة المدير."
      />

      <TournamentsListTable
        rows={paged}
        search={search}
        onSearchChange={setSearch}
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        onParticipants={openParticipants}
        actionsMode="viewOnly"
      />
    </div>
  );
}
