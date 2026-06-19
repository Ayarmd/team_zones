import { useEffect, useMemo, useState } from "react";
import TablePagination from "../../../shared/components/TablePagination";
import {
  faultRowDisplayStatus,
  faultStatusBadgeClass,
  formatDisplayDate,
  formatFaultCost,
} from "../../maintenance/data/faultMeta";
import { loadDevices } from "../../devices-packages/data/devicesStorage";
import DeviceNameCell from "./DeviceNameCell";

const PAGE_SIZE = 8;

const FILTER_META = {
  waiting: { title: "أعطال في الانتظار", empty: "لا توجد أعطال في الانتظار." },
  inProgress: { title: "أعطال قيد الإصلاح", empty: "لا توجد أعطال قيد الإصلاح." },
  resolved: { title: "أعطال تم إصلاحها", empty: "لا توجد أعطال مُصلَحة في السجل." },
};

function FaultRowStatusBadge({ row }) {
  const device = loadDevices().find((d) => d.id === row.deviceId);
  const ui = faultRowDisplayStatus(row, device);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${faultStatusBadgeClass(ui.tone)}`}>
      {ui.label}
    </span>
  );
}

export default function MaintenanceDashboardFaultsTable({ filter, rows = [] }) {
  const [page, setPage] = useState(1);
  const meta = FILTER_META[filter] || FILTER_META.waiting;

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paged = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const isResolved = filter === "resolved";

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">{meta.title}</h2>
        <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
          {rows.length} سجل
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-right text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="px-5 py-2.5 font-bold">الجهاز</th>
              <th className="px-3 py-2.5 font-bold">نوع العطل</th>
              {isResolved ? (
                <>
                  <th className="px-3 py-2.5 font-bold">تاريخ العطل</th>
                  <th className="px-3 py-2.5 font-bold">تاريخ الإصلاح</th>
                  <th className="px-5 py-2.5 font-bold">تكلفة الإصلاح</th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2.5 font-bold">تاريخ العطل</th>
                  <th className="px-5 py-2.5 font-bold">الحالة</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={isResolved ? 5 : 4} className="px-5 py-10 text-center text-gray-400">
                  {meta.empty}
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-5 py-3">
                    <DeviceNameCell
                      deviceName={row.deviceName}
                      deviceTypeLabel={row.deviceTypeLabel}
                      deviceId={row.deviceId}
                    />
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.faultTypeLabel}</td>
                  {isResolved ? (
                    <>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500" dir="ltr">
                        {formatDisplayDate(row.createdAt)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500" dir="ltr">
                        {formatDisplayDate(row.resolvedAt)}
                      </td>
                      <td className="px-5 py-3 font-bold text-[#6B5478]">
                        {formatFaultCost(row.maintenanceCost)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500" dir="ltr">
                        {formatDisplayDate(row.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <FaultRowStatusBadge row={row} />
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > PAGE_SIZE ? (
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={rows.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  );
}
