import AdminModal from "../../devices-packages/components/AdminModal";
import Button from "../../super-admin/components/ui/Button";
import { TournamentDetailCell } from "./TournamentDetailUi";
import { tournamentCoverImage, tournamentStatusLabel } from "../data/tournamentMeta";
import { countParticipantsForTournament, getTournamentCapacity } from "../data/tournamentParticipantsStorage";

export default function TournamentDetailsModal({ open, tournament, onClose }) {
  if (!open || !tournament) return null;

  const capacity = getTournamentCapacity(tournament.id);
  const filled = countParticipantsForTournament(tournament.id);
  const delayM = tournament.delayMinutes ?? "—";

  return (
    <AdminModal open={open} onClose={onClose} title="تفاصيل البطولة" wide>
      <div className="mt-4 space-y-4">
        <img
          src={tournamentCoverImage(tournament)}
          alt={tournament.name}
          className="h-40 w-full rounded-xl object-cover sm:h-48"
        />

        <div className="rounded-xl border border-[#6B5478]/15 bg-[#6B5478]/5 px-4 py-3 dark:border-[#6B5478]/25 dark:bg-[#6B5478]/10">
          <p className="text-base font-extrabold text-gray-900 dark:text-white">{tournament.name}</p>
          <p className="mt-1 text-[11px] font-semibold text-gray-500">
            {tournament.game} · {filled}/{capacity} مشترك
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TournamentDetailCell label="اسم البطولة" value={tournament.name} />
          <TournamentDetailCell label="اللعبة" value={tournament.game} />
          <TournamentDetailCell label="عدد المشاركين" value={String(tournament.participants ?? "—")} />
          <TournamentDetailCell label="تاريخ البداية" value={tournament.startDate} />
          <TournamentDetailCell label="تاريخ النهاية" value={tournament.endDate || "—"} />
          <TournamentDetailCell label="الجائزة" value={tournament.prize || "—"} />
          <TournamentDetailCell label="حالة البطولة" value={tournamentStatusLabel(tournament.status)} />
          <TournamentDetailCell label="في حالة الانسحاب" value={tournament.withdrawal || "—"} />
          <TournamentDetailCell label="في حالة التعادل" value={tournament.tieRule || "—"} />
          <TournamentDetailCell
            label="مدة التأخير قبل احتساب الخسارة"
            value={delayM === "—" ? "—" : `${delayM} دقيقة`}
          />
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </AdminModal>
  );
}
