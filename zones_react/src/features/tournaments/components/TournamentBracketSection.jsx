import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { GitBranch } from "lucide-react";
import TournamentBracket from "../../../components/TournamentBracket";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import { TournamentBreadcrumb } from "./TournamentDetailUi";
import { getOrCreateBracketState, isBracketReady } from "../bracket/bracketStorage";
import { loadTournamentRows, TOURNAMENTS_LIST_EVENT } from "../tournamentsListStorage";
import { TOURNAMENT_PARTICIPANTS_EVENT } from "../data/tournamentParticipantsStorage";

/**
 * @param {object} props
 * @param {object} props.routes
 * @param {string} props.routes.tournaments
 * @param {(id: number) => string} props.routes.details
 * @param {(id: number) => string} [props.routes.participants]
 * @param {boolean} [props.readOnly]
 */
export default function TournamentBracketSection({ routes, readOnly = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const numericId = Number(id);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const sync = () => setRefreshKey((k) => k + 1);
    window.addEventListener(TOURNAMENTS_LIST_EVENT, sync);
    window.addEventListener(TOURNAMENT_PARTICIPANTS_EVENT, sync);
    return () => {
      window.removeEventListener(TOURNAMENTS_LIST_EVENT, sync);
      window.removeEventListener(TOURNAMENT_PARTICIPANTS_EVENT, sync);
    };
  }, []);

  const tournament = useMemo(() => {
    const list = loadTournamentRows();
    const fromState = location.state?.tournament;
    const fromList = list.find((r) => r.id === numericId);
    if (fromList) return fromList;
    if (fromState && Number(fromState.id) === numericId) return fromState;
    return list.find((r) => r.id === numericId) ?? null;
  }, [numericId, location.key, location.state, refreshKey]);

  const bracketReady = tournament ? isBracketReady(tournament) : false;
  const bracket = useMemo(() => {
    if (!tournament || !bracketReady) return null;
    return getOrCreateBracketState(tournament);
  }, [tournament, bracketReady, refreshKey]);

  const participantsPath = routes.participants?.(numericId);
  const fromParticipants = location.state?.from === "participants";

  const goBack = () => {
    if (fromParticipants && participantsPath) {
      navigate(participantsPath, { state: { tournament, from: "list" } });
      return;
    }
    navigate(routes.details(numericId), {
      state: { tournament, from: location.state?.from },
    });
  };

  if (!Number.isFinite(numericId) || !tournament) {
    return (
      <>
        <PageHeader title="شجرة البطولة" onBack={() => navigate(-1)} backLabel="رجوع" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <p>تعذر تحميل الشجرة.</p>
          <Link to={routes.tournaments} className="mt-2 inline-block text-xs font-bold text-[#6B5478]">
            العودة لعرض البطولات
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="شجرة البطولة"
        description={tournament.name}
        onBack={goBack}
        backLabel={fromParticipants ? "رجوع لقائمة المشاركين" : "رجوع لتفاصيل البطولة"}
      />

      <section className="space-y-4">
        <TournamentBreadcrumb tournamentName={tournament.name} view="bracket" />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {!bracketReady || !bracket ? (
            <div className="px-4 py-12 text-center">
              <GitBranch size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                الشجرة غير متاحة — لم يكتمل عدد المشاركين
              </p>
              <p className="mt-1 text-xs text-gray-500">
                أكمل التسجيل من التطبيق ثم ارجع من قائمة المشاركين.
              </p>
              {participantsPath ? (
                <Link
                  to={participantsPath}
                  state={{ tournament, from: "list" }}
                  className="mt-4 inline-flex rounded-xl border border-[#6B5478]/30 bg-[#6B5478]/10 px-4 py-2 text-xs font-bold text-[#6B5478]"
                >
                  العودة لقائمة المشاركين
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto p-4 sm:p-5">
              <TournamentBracket
                tournament={tournament}
                bracketState={bracket}
                variant={readOnly ? "view" : "manager"}
                onBack={goBack}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
