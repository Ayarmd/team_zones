import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { GitBranch } from "lucide-react";
import TournamentBracket from "../../../components/TournamentBracket";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import Button from "../../super-admin/components/ui/Button";
import { TournamentBreadcrumb } from "./TournamentDetailUi";
import BracketSkeletonLoader from "../bracket/BracketSkeletonLoader";
import { useBracketData } from "../bracket/useBracketData";
import { notifyTournamentWinner } from "../data/managerTournamentsApi";

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

  const {
    tournament: apiTournament,
    bracket,
    isLoading,
    error,
    apiSync,
    bracketReady,
    setBracketState,
  } = useBracketData(numericId);

  const tournament = useMemo(() => {
    const fromState = location.state?.tournament;
    if (fromState && Number(fromState.id) === numericId) return fromState;
    if (apiTournament && Number(apiTournament.id) === numericId) return apiTournament;
    return null;
  }, [numericId, location.state, apiTournament]);

  const skeletonSize = tournament?.participants ?? 8;

  const [notifyBusy, setNotifyBusy] = useState(false);
  const [winnerPushNotice, setWinnerPushNotice] = useState("");

  const finalMatchHasWinner = useMemo(() => {
    if (!bracket?.rounds?.length) return false;
    const lastRound = bracket.rounds[bracket.rounds.length - 1];
    const finalMatch = lastRound?.matches?.[0];
    return Boolean(finalMatch?.winner);
  }, [bracket]);

  const resendWinnerNotification = async () => {
    if (!tournament?.id || notifyBusy) return;
    setNotifyBusy(true);
    setWinnerPushNotice("");
    const result = await notifyTournamentWinner(tournament.id);
    setNotifyBusy(false);
    if (!result.ok) {
      setWinnerPushNotice(result.error || "تعذر إرسال الإشعار.");
      return;
    }
    setWinnerPushNotice(result.message || "تم إرسال إشعار الفوز لجميع مستخدمي التطبيق.");
  };

  const goBack = () => {
    navigate(routes.tournaments);
  };

  if (!Number.isFinite(numericId)) {
    return (
      <>
        <PageHeader title="شجرة البطولة" onBack={() => navigate(-1)} backLabel="رجوع" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <p>معرّف البطولة غير صالح.</p>
        </div>
      </>
    );
  }

  if (!isLoading && error && !tournament) {
    return (
      <>
        <PageHeader title="شجرة البطولة" onBack={() => navigate(-1)} backLabel="رجوع" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <p>{error}</p>
          <Link to={routes.tournaments} className="mt-2 inline-block text-xs font-bold text-[#6B5478]">
            العودة للبطولات
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="شجرة البطولة"
        description={tournament?.name || "..."}
        onBack={goBack}
        backLabel="رجوع للبطولات"
        actions={
          tournament ? (
            <>
              {!readOnly && apiSync && finalMatchHasWinner ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={notifyBusy}
                  onClick={resendWinnerNotification}
                >
                  {notifyBusy ? "جاري الإرسال…" : "إرسال إشعار الفوز"}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(routes.details(tournament.id), {
                    state: { tournament, from: "bracket" },
                  })
                }
              >
                تفاصيل البطولة
              </Button>
            </>
          ) : null
        }
      />

      <section className="space-y-4">
        {tournament ? <TournamentBreadcrumb tournamentName={tournament.name} view="bracket" /> : null}

        {winnerPushNotice ? (
          <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
            {winnerPushNotice}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#2D2D3D] bg-[#0F0F12] shadow-lg shadow-black/20">
          {isLoading ? (
            <div className="overflow-x-auto p-3 sm:p-4">
              <BracketSkeletonLoader bracketSize={skeletonSize} variant="manager" />
            </div>
          ) : !bracketReady || !bracket ? (
            <div className="px-4 py-12 text-center">
              <GitBranch size={36} className="mx-auto mb-3 text-[#374151]" />
              <p className="text-sm font-bold text-[#F3F4F6]">
                الشجرة غير متاحة — لم يكتمل عدد المشاركين
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                أكمل التسجيل من التطبيق ثم ارجع لعرض الشجرة.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto p-3 sm:p-4">
              <TournamentBracket
                tournament={tournament}
                bracketState={bracket}
                variant={readOnly ? "view" : "manager"}
                onBack={goBack}
                onBracketChange={setBracketState}
                apiSync={!readOnly && apiSync}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
