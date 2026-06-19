import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { zonesConfirm, zonesToastError, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import TournamentsListTable from "../components/TournamentsListTable";
import { generateTournamentBracket } from "../bracket/bracketStorage";
import { isTournamentParticipantsFull } from "../data/tournamentParticipantsStorage";
import {
  archiveTournamentRow,
  loadTournamentRows,
  saveTournamentRows,
} from "../tournamentsListStorage";

const PAGE_SIZE = 5;

export default function TournamentsPage() {
  const navigate = useNavigate();
  const [allRows, setAllRows] = useState(() => loadTournamentRows());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const skipNextSave = useRef(true);

  const rows = useMemo(() => allRows.filter((r) => !r.isArchived), [allRows]);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveTournamentRows(allRows);
  }, [allRows]);

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

  const updateRow = (id, patch) => {
    setAllRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const openParticipants = (row) => {
    navigate(`/tournaments/${row.id}/participants`, {
      state: { tournament: row, from: "list" },
    });
  };

  const handleGenerateBracket = async (row) => {
    if (!isTournamentParticipantsFull(row.id, row.participants)) {
      zonesToastError("لم يكتمل عدد المشاركين بعد.");
      return;
    }
    const ok = await zonesConfirm({
      title: "توليد المواجهات؟",
      text: `سيتم إجراء قرعة عشوائية وتوزيع ${row.participants} مشتركاً على شجرة الإقصاء.`,
      confirmText: "توليد الجدول",
      cancelText: "تراجع",
    });
    if (!ok) return;

    const result = generateTournamentBracket(row);
    if (!result.ok) {
      zonesToastError(result.error);
      return;
    }
    updateRow(row.id, { status: "started" });
    zonesToastSuccess("تم توليد شجرة البطولة");
    navigate(`/tournaments/${row.id}/bracket`, {
      state: { tournament: { ...row, status: "started" }, from: "list" },
    });
  };

  const handleArchive = async (row) => {
    const ok = await zonesConfirm({
      title: "أرشفة البطولة؟",
      text: `سيتم نقل «${row.name}» للأرشيف وإخفاؤها من واجهة الزبائن.`,
      confirmText: "أرشفة",
      cancelText: "تراجع",
    });
    if (!ok) return;
    setAllRows((list) => archiveTournamentRow(list, row.id));
    zonesToastSuccess("تمت الأرشفة");
  };

  const handleCancel = async (row) => {
    const ok = await zonesConfirm({
      title: "إلغاء البطولة؟",
      text: `حالة طارئة — سيتم إلغاء «${row.name}» قبل بدئها.`,
      icon: "warning",
      confirmText: "إلغاء البطولة",
      cancelText: "تراجع",
      danger: true,
    });
    if (!ok) return;
    updateRow(row.id, { status: "cancelled" });
    zonesToastSuccess("تم إلغاء البطولة");
  };

  const canGenerate = (row) =>
    row.status === "upcoming" && isTournamentParticipantsFull(row.id, row.participants);

  const canArchive = (row) => row.status === "started" || row.status === "finished";

  const canCancel = (row) => row.status === "upcoming";

  return (
    <ManagerLayout>
      <PageHeader
        title="عرض البطولات"
        description="إدارة البطولات — مشاركون، توليد المواجهات، أرشفة، أو إلغاء."
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
        onGenerateBracket={handleGenerateBracket}
        onArchive={handleArchive}
        onCancel={handleCancel}
        canGenerate={canGenerate}
        canArchive={canArchive}
        canCancel={canCancel}
        actionsMode="manager"
      />
    </ManagerLayout>
  );
}
