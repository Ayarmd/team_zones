import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import TablePagination from "../../../shared/components/TablePagination";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import { formatParticipantDate, winnerLabel } from "../data/participantMeta";
import {
  TOURNAMENT_PARTICIPANTS_EVENT,
  getTournamentFilterOptions,
  loadTournamentParticipants,
  saveTournamentParticipants,
} from "../data/tournamentParticipantsStorage";
import { TOURNAMENTS_LIST_EVENT } from "../tournamentsListStorage";

const PAGE_SIZE = 5;

const selectCls =
  "min-w-[200px] appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pe-9 ps-3 text-xs font-semibold text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function WinnerBadge({ isWinner }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        isWinner
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
      }`}
    >
      {winnerLabel(isWinner)}
    </span>
  );
}

export default function TournamentParticipantsSection() {
  const [rows, setRows] = useState(() => loadTournamentParticipants());
  const [search, setSearch] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const skipNextSave = useRef(true);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveTournamentParticipants(rows);
  }, [rows]);

  useEffect(() => {
    const sync = () => {
      setRows((prev) => {
        const next = loadTournamentParticipants();
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    };
    window.addEventListener(TOURNAMENT_PARTICIPANTS_EVENT, sync);
    window.addEventListener(TOURNAMENTS_LIST_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(TOURNAMENT_PARTICIPANTS_EVENT, sync);
      window.removeEventListener(TOURNAMENTS_LIST_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const tournamentOptions = useMemo(() => getTournamentFilterOptions(rows), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      const matchesTournament =
        tournamentFilter === "all" || p.tournamentName === tournamentFilter;
      if (!matchesTournament) return false;
      if (!q) return true;
      return (
        p.fullName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.tournamentName?.toLowerCase().includes(q)
      );
    });
  }, [rows, search, tournamentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, tournamentFilter]);

  return (
    <>
      <PageHeader
        title="قائمة المشاركين"
        description="جميع المشتركين في البطولات — فلترة حسب البطولة."
      />

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">المشتركون</h2>
          <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
            {filtered.length} مشترك
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="بحث بالاسم أو البريد أو الهاتف..."
          />
          <div className="relative shrink-0">
            <SlidersHorizontal
              size={14}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#6B5478]"
            />
            <select
              className={`${selectCls} ps-9`}
              value={tournamentFilter}
              onChange={(e) => setTournamentFilter(e.target.value)}
              aria-label="فلترة البطولة"
            >
              <option value="all">كل البطولات</option>
              {tournamentOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-3 py-2.5 font-bold">#</th>
                <th className="px-3 py-2.5 font-bold">اسم المشترك</th>
                <th className="px-3 py-2.5 font-bold">البريد الإلكتروني</th>
                <th className="px-3 py-2.5 font-bold">رقم الهاتف</th>
                <th className="px-3 py-2.5 font-bold">اسم البطولة</th>
                <th className="px-3 py-2.5 font-bold">تاريخ التسجيل</th>
                <th className="px-3 py-2.5 font-bold">فائز أو لا</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paged.map((row) => (
                <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-3 font-extrabold text-[#6B5478]" dir="ltr">
                    {row.slotIndex || "—"}
                  </td>
                  <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">{row.fullName}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                    {row.email}
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                    {row.phone}
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.tournamentName}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                    {formatParticipantDate(row.registeredAt)}
                  </td>
                  <td className="px-3 py-3">
                    <WinnerBadge isWinner={row.isWinner} />
                  </td>
                </tr>
              ))}
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-gray-400">
                    لا يوجد مشتركون مطابقون.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </section>
    </>
  );
}

