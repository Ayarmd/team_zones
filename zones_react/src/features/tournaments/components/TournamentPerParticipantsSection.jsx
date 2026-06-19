import { useEffect, useMemo, useState } from "react";
import { GitBranch, Users } from "lucide-react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import Button from "../../super-admin/components/ui/Button";
import { TournamentBreadcrumb } from "./TournamentDetailUi";
import { isBracketReady } from "../bracket/bracketStorage";
import { formatParticipantDate } from "../data/participantMeta";
import {
  TOURNAMENT_PARTICIPANTS_EVENT,
  buildTournamentSlotGrid,
  countParticipantsForTournament,
  getTournamentCapacity,
  loadTournamentParticipants,
} from "../data/tournamentParticipantsStorage";
import { loadTournamentRows, TOURNAMENTS_LIST_EVENT } from "../tournamentsListStorage";

/**
 * @param {object} props
 * @param {object} props.routes
 * @param {string} props.routes.tournaments
 * @param {(id: number) => string} props.routes.bracket
 * @param {boolean} [props.readOnly]
 */
export default function TournamentPerParticipantsSection({ routes, readOnly = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const numericId = Number(id);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const sync = () => setRefreshKey((k) => k + 1);
    window.addEventListener(TOURNAMENTS_LIST_EVENT, sync);
    window.addEventListener(TOURNAMENT_PARTICIPANTS_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(TOURNAMENTS_LIST_EVENT, sync);
      window.removeEventListener(TOURNAMENT_PARTICIPANTS_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const tournament = useMemo(() => {
    const list = loadTournamentRows();
    const fromState = location.state?.tournament;
    const fromList = list.find((r) => r.id === numericId);
    if (fromList) return fromList;
    if (fromState && Number(fromState.id) === numericId) return fromState;
    return null;
  }, [numericId, location.key, location.state, refreshKey]);

  const capacity = tournament ? getTournamentCapacity(tournament.id) : 0;
  const filled = tournament ? countParticipantsForTournament(tournament.id) : 0;
  const isFull = tournament ? filled >= capacity : false;
  const slots = useMemo(() => {
    if (!tournament) return [];
    loadTournamentParticipants();
    return buildTournamentSlotGrid(tournament.id, capacity);
  }, [tournament, capacity, refreshKey]);

  const backPath = location.state?.from === "list" ? routes.tournaments : routes.tournaments;

  const openBracket = () => {
    if (!tournament || !isFull) return;
    navigate(routes.bracket(tournament.id), {
      state: { tournament, from: "participants" },
    });
  };

  if (!Number.isFinite(numericId) || !tournament) {
    return (
      <>
        <PageHeader title="قائمة المشاركين" onBack={() => navigate(routes.tournaments)} backLabel="رجوع" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <p>تعذر تحميل قائمة المشاركين.</p>
          <Link to={routes.tournaments} className="mt-2 inline-block text-xs font-bold text-[#6B5478]">
            العودة لعرض البطولات
          </Link>
        </div>
      </>
    );
  }

  const progressPct = capacity ? Math.round((filled / capacity) * 100) : 0;

  return (
    <>
      <PageHeader
        title="قائمة المشاركين"
        description={`${tournament.name} — ${filled} / ${capacity} مشترك`}
        onBack={() => navigate(backPath)}
        backLabel="رجوع لعرض البطولات"
      />

      <section className="space-y-4">
        <TournamentBreadcrumb tournamentName={tournament.name} view="participants" />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#6B5478]" />
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">
                مشتركو «{tournament.name}»
              </h2>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isFull
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              }`}
            >
              {isFull ? "مكتملة — جاهزة للشجرة" : `${filled} / ${capacity} — بانتظار التطبيق`}
            </span>
          </div>

          <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
            <div className="mb-1 flex justify-between text-[11px] font-bold text-gray-500">
              <span>تقدم التسجيل من التطبيق</span>
              <span dir="ltr">{filled}/{capacity}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-full rounded-full transition-all ${isFull ? "bg-emerald-500" : "bg-[#6B5478]"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              {readOnly
                ? "عرض فقط — التسجيل يتم من تطبيق الزبون حسب قوانين البطولة."
                : "كل طلب من التطبيق يملأ خانة بالترتيب (1، 2، 3…). عند الاكتمال تُوزَّع الأسماء تلقائياً على الشجرة."}
            </p>
          </div>

          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[720px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-3 py-2.5 font-bold">#</th>
                  <th className="px-3 py-2.5 font-bold">اسم المشترك</th>
                  <th className="px-3 py-2.5 font-bold">البريد</th>
                  <th className="px-3 py-2.5 font-bold">الهاتف</th>
                  <th className="px-3 py-2.5 font-bold">تاريخ التسجيل</th>
                  <th className="px-3 py-2.5 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {slots.map(({ slotIndex, participant }) => (
                  <tr
                    key={slotIndex}
                    className={
                      participant
                        ? "transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        : "bg-gray-50/50 dark:bg-gray-800/20"
                    }
                  >
                    <td className="px-3 py-3 font-extrabold text-[#6B5478]" dir="ltr">
                      {slotIndex}
                    </td>
                    <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">
                      {participant?.fullName || "— فارغ —"}
                    </td>
                    <td className="px-3 py-3 text-gray-600" dir="ltr">
                      {participant?.email || "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-600" dir="ltr">
                      {participant?.phone || "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {participant ? formatParticipantDate(participant.registeredAt) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {participant ? (
                        <span className="inline-flex rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
                          مسجّل
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-200 px-2.5 py-0.5 text-[11px] font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          بانتظار التطبيق
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
              <GitBranch size={16} className="text-[#6B5478]" />
              شجرة البطولة
            </h2>
          </div>
          <div className="space-y-4 p-5">
            {!isFull ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center dark:border-gray-700 dark:bg-gray-800/40">
                <GitBranch size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  الشجرة فارغة — لم يكتمل عدد المشاركين بعد
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  يتبقى {capacity - filled} مقعداً من أصل {capacity}. عند اكتمال التسجيل تُولَّد الشجرة
                  تلقائياً وتوزَّع الأسماء عشوائياً.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  اكتملت البطولة — الشجرة جاهزة ({capacity} مشترك)
                </p>
                <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                  تم توزيع المشاركين تلقائياً على جدول الإقصاء.
                </p>
              </div>
            )}

            <div className="flex justify-center border-t border-gray-100 pt-4 dark:border-gray-800">
              <Button
                size="sm"
                icon={GitBranch}
                onClick={openBracket}
                disabled={!isFull || !isBracketReady(tournament)}
              >
                عرض شجرة
              </Button>
            </div>
            {!isFull ? (
              <p className="text-center text-[11px] text-gray-400">
                زر «عرض شجرة» يُفعَّل بعد اكتمال {capacity} مشتركاً.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
