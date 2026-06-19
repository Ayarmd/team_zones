import TournamentRowActions from "./TournamentRowActions";
import StatusBadge from "./StatusBadge";

export default function TournamentTable({ rows, searchQuery, onAction, onRowOpen }) {
  const q = searchQuery.trim();
  const filtered = q
    ? rows.filter((r) => r.name.includes(q) || r.game.includes(q) || r.startDate.includes(q))
    : rows;

  return (
    <div className="tournaments-table-wrap no-scrollbar rounded-xl border border-slate-800/80" data-zones-table-wrap>
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-800/90 bg-[#0b0e14]/70 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-3 py-3 text-end">اسم البطولة</th>
            <th className="px-3 py-3 text-end">اللعبة</th>
            <th className="px-3 py-3 text-end">عدد المشاركين</th>
            <th className="px-3 py-3 text-end">تاريخ البداية</th>
            <th className="px-3 py-3 text-end">الحالة</th>
            <th className="px-3 py-3 text-end">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {filtered.map((row) => (
            <tr
              key={row.id}
              className={`bg-[#0f131a]/40 transition hover:bg-[#151a24]/80 ${onRowOpen ? "cursor-pointer" : ""}`}
              onClick={() => onRowOpen?.(row)}
              role={onRowOpen ? "button" : undefined}
              tabIndex={onRowOpen ? 0 : undefined}
              onKeyDown={
                onRowOpen
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowOpen(row);
                      }
                    }
                  : undefined
              }
              aria-label={onRowOpen ? `عرض تفاصيل ${row.name}` : undefined}
            >
              <td className="px-3 py-3 text-end">
                <span className="tournament-row-name font-medium text-violet-200 underline-offset-2 hover:text-white hover:underline">
                  {row.name}
                </span>
              </td>
              <td className="px-3 py-3 text-end text-slate-300">{row.game}</td>
              <td className="px-3 py-3 text-end">
                <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg border border-slate-700/80 bg-[#0b0e14]/80 px-2 py-1 text-xs font-bold tabular-nums text-slate-200">
                  {row.participants}
                </span>
              </td>
              <td className="px-3 py-3 text-end tabular-nums text-slate-300">{row.startDate}</td>
              <td className="px-3 py-3 text-end">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-3 py-3 text-end" onClick={(e) => e.stopPropagation()}>
                <TournamentRowActions row={row} onAction={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
