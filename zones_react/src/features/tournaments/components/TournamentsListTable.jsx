import TablePagination from "../../../shared/components/TablePagination";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import Button from "../../super-admin/components/ui/Button";
import TournamentRowActions from "./TournamentRowActions";
import TournamentStatusBadge from "./TournamentStatusBadge";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";

export default function TournamentsListTable({
  rows,
  search,
  onSearchChange,
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onDetails,
  onParticipants,
  onGenerateBracket,
  onArchive,
  onCancel,
  canGenerate,
  canArchive,
  canCancel,
  showAddButton,
  onAdd,
  actionsMode = "manager",
}) {
  const detailsOnly = actionsMode === "details";
  const viewOnly = actionsMode === "viewOnly";
  const manager = actionsMode === "manager";

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">قائمة البطولات</h2>
        <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
          {totalItems} بطولة
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <SearchBar value={search} onChange={onSearchChange} placeholder="بحث عن بطولة..." />
        {showAddButton ? (
          <Button size="sm" onClick={onAdd}>
            + إضافة بطولة
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-right text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="px-3 py-2.5 font-bold">اسم البطولة</th>
              <th className="px-3 py-2.5 font-bold">عدد المشاركين</th>
              <th className="px-3 py-2.5 font-bold">تاريخ البداية</th>
              <th className="px-3 py-2.5 font-bold">تاريخ النهاية</th>
              <th className="px-3 py-2.5 font-bold">الحالة</th>
              <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">{row.name}</td>
                <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.participants}</td>
                <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                  {row.startDate}
                </td>
                <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                  {row.endDate || "—"}
                </td>
                <td className="px-3 py-3">
                  <TournamentStatusBadge status={row.isArchived ? "archived" : row.status} />
                </td>
                <td className={TABLE_ACTIONS_TD}>
                  <TournamentRowActions
                    mode={detailsOnly ? "details" : viewOnly ? "viewOnly" : "manager"}
                    onDetails={() => onDetails?.(row)}
                    onParticipants={() => onParticipants?.(row)}
                    onGenerateBracket={() => onGenerateBracket?.(row)}
                    onArchive={() => onArchive?.(row)}
                    onCancel={() => onCancel?.(row)}
                    canGenerate={manager ? canGenerate?.(row) : false}
                    canArchive={manager ? canArchive?.(row) : false}
                    canCancel={manager ? canCancel?.(row) : false}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-gray-400">
                  لا توجد بطولات مطابقة.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </section>
  );
}
