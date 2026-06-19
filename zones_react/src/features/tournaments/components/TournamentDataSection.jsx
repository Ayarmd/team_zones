import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import CreateTournamentModal from "./CreateTournamentModal";
import TournamentDetailsModal from "./TournamentDetailsModal";
import TournamentsListTable from "./TournamentsListTable";
import { useTournamentRowsSync } from "../hooks/useTournamentRowsSync";
import { loadTournamentRows } from "../tournamentsListStorage";

const PAGE_SIZE = 5;

export default function TournamentDataSection({
  showAddButton = false,
  autoOpenAdd = false,
}) {
  const [rows, setRows] = useState(() => loadTournamentRows());
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useTournamentRowsSync(setRows);

  useEffect(() => {
    if (showAddButton && autoOpenAdd) setCreateOpen(true);
  }, [showAddButton, autoOpenAdd]);

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

  const openDetails = (row) => {
    setDetailRow(row);
    setDetailOpen(true);
  };

  return (
    <>
      <PageHeader
        title="بيانات البطولة"
        description="عرض بيانات البطولات — التفاصيل منبثقة بدون قائمة المشاركين."
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
        onDetails={openDetails}
        actionsMode="details"
        showAddButton={showAddButton}
        onAdd={showAddButton ? () => setCreateOpen(true) : undefined}
      />

      <TournamentDetailsModal
        open={detailOpen}
        tournament={detailRow}
        onClose={() => {
          setDetailOpen(false);
          setDetailRow(null);
        }}
      />

      {showAddButton ? (
        <CreateTournamentModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() => setRows(loadTournamentRows())}
        />
      ) : null}
    </>
  );
}
