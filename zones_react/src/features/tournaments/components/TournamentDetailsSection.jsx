import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import { TournamentBreadcrumb, TournamentDetailCell } from "./TournamentDetailUi";
import { loadTournamentRows, TOURNAMENTS_LIST_EVENT } from "../tournamentsListStorage";
import { tournamentCoverImage, tournamentStatusLabel } from "../data/tournamentMeta";

/**
 * @param {object} routes
 * @param {string} routes.tournaments — عرض البطولات
 * @param {string} routes.tournamentsData — بيانات البطولة
 * @param {(id: number) => string} [routes.participants] — قائمة المشاركين
 */
export default function TournamentDetailsSection({ routes }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const numericId = Number(id);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const sync = () => setRefreshKey((k) => k + 1);
    window.addEventListener(TOURNAMENTS_LIST_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(TOURNAMENTS_LIST_EVENT, sync);
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

  if (id === "data" || id === "participants") {
    return <Navigate to={routes.tournamentsData} replace />;
  }

  if (!Number.isFinite(numericId)) {
    return (
      <>
        <PageHeader
          title="تفاصيل البطولة"
          onBack={() => navigate(routes.tournamentsData)}
          backLabel="رجوع"
        />
        <p className="text-sm text-gray-500">معرّف غير صالح.</p>
        <Link to={routes.tournaments} className="mt-2 inline-block text-xs font-bold text-[#6B5478]">
          العودة لعرض البطولات
        </Link>
      </>
    );
  }

  if (!tournament) {
    return (
      <>
        <PageHeader
          title="تفاصيل البطولة"
          onBack={() =>
            navigate(location.state?.from === "data" ? routes.tournamentsData : routes.tournaments)
          }
          backLabel="رجوع"
        />
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">لم يتم العثور على هذه البطولة.</p>
          <Link
            to={routes.tournaments}
            className="mt-4 inline-flex rounded-xl border border-[#6B5478]/30 bg-[#6B5478]/10 px-4 py-2 text-xs font-bold text-[#6B5478]"
          >
            العودة لعرض البطولات
          </Link>
        </div>
      </>
    );
  }

  const delayM = tournament.delayMinutes ?? "—";
  const fromData = location.state?.from === "data";
  const backPath = fromData ? routes.tournamentsData : routes.tournaments;
  const backLabel = fromData ? "رجوع لبيانات البطولة" : "رجوع لعرض البطولات";

  return (
    <>
      <PageHeader
        title="تفاصيل البطولة"
        description={tournament.name}
        onBack={() => navigate(backPath)}
        backLabel={backLabel}
      />

      <section className="space-y-4">
        <TournamentBreadcrumb tournamentName={tournament.name} view="details" />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <img
            src={tournamentCoverImage(tournament)}
            alt={tournament.name}
            className="h-48 w-full object-cover sm:h-56"
          />

          <div className="space-y-4 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </div>
      </section>
    </>
  );
}

