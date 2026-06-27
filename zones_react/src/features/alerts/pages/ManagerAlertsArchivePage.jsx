import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import TablePagination from "../../../shared/components/TablePagination";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import {
  TableBulkActionBar,
  TableSelectHeaderCell,
  TableSelectRowCell,
  selectableRowClass,
} from "../../../shared/components/ui/TableSelection";
import { useTableSelection } from "../../../shared/hooks/useTableSelection";
import {
  alertTargetLabel,
  formatAlertRecordCode,
} from "../data/alertsMeta";
import {
  loadArchivedAlerts,
  MANAGER_ALERTS_EVENT,
} from "../data/managerAlertsStorage";
import {
  fetchArchivedManagerAlerts,
  MANAGER_ALERTS_ARCHIVED_EVENT,
} from "../data/managerAlertsApi";
import { getActiveStaffSession, isApiStaffSession } from "../../devices-packages/data/hallCatalogSync";
import ManagerAlertDetailsModal from "../components/ManagerAlertDetailsModal";

const PAGE_SIZE = 8;

export default function ManagerAlertsArchivePage() {
  const [alerts, setAlerts] = useState(() => loadArchivedAlerts());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detailAlert, setDetailAlert] = useState(null);

  const refresh = useCallback(async () => {
    const session = getActiveStaffSession();
    if (isApiStaffSession(session) && session.role === "manager") {
      const result = await fetchArchivedManagerAlerts();
      if (result.ok) {
        setAlerts(result.alerts);
        return;
      }
    }
    setAlerts(loadArchivedAlerts());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(MANAGER_ALERTS_EVENT, refresh);
    window.addEventListener(MANAGER_ALERTS_ARCHIVED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(MANAGER_ALERTS_EVENT, refresh);
      window.removeEventListener(MANAGER_ALERTS_ARCHIVED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return alerts;
    return alerts.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        alertTargetLabel(row.targetAudience ?? row.targetCategories ?? row.targetCategory).toLowerCase().includes(q) ||
        formatAlertRecordCode(row.id).toLowerCase().includes(q),
    );
  }, [alerts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds = useMemo(() => paged.map((row) => row.id), [paged]);
  const selection = useTableSelection({ items: alerts, pageIds });

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <ManagerLayout>
      <div className="space-y-4" dir="rtl">
        <PageHeader
          title="أرشفة التنبيهات"
          description="التنبيهات الموقوفة — لا يمكن إعادة تفعيلها."
        />

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">أرشفة التنبيهات</h2>
            <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
              {filtered.length} سجل
            </span>
          </div>

          <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
            <SearchBar
              containerClassName="min-w-[220px] max-w-md"
              value={search}
              onChange={setSearch}
              placeholder="بحث برقم السجل أو اسم التنبيه..."
            />
          </div>

          <TableBulkActionBar count={selection.count} onClear={selection.clearSelection} actions={[]} />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <TableSelectHeaderCell {...selection} />
                  <th className="px-3 py-2.5 font-bold">رقم السجل</th>
                  <th className="px-3 py-2.5 font-bold">اسم التنبيه</th>
                  <th className="px-3 py-2.5 font-bold">فئة مستهدفة</th>
                  <th className="px-3 py-2.5 font-bold">تاريخ البداية</th>
                  <th className="px-3 py-2.5 font-bold">تاريخ النهاية</th>
                  <th className="px-3 py-2.5 font-bold">الحالة</th>
                  <th className={TABLE_ACTIONS_TH}>الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-gray-400">
                      لا توجد تنبيهات مؤرشفة.
                    </td>
                  </tr>
                ) : (
                  paged.map((row) => (
                    <tr key={row.id} className={selectableRowClass(selection.isSelected(row.id))}>
                      <TableSelectRowCell id={row.id} ariaLabel={`تحديد ${row.name}`} {...selection} />
                      <td className="px-3 py-3 font-bold text-[#6B5478]" dir="ltr">
                        {formatAlertRecordCode(row.id)}
                      </td>
                      <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">{row.name}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                        {alertTargetLabel(row.targetAudience ?? row.targetCategories ?? row.targetCategory)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500" dir="ltr">
                        {row.startDate}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500" dir="ltr">
                        {row.endDate || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full bg-gray-200 px-2.5 py-0.5 text-[11px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          موقوفة
                        </span>
                      </td>
                      <td className={TABLE_ACTIONS_TD}>
                        <TableActionsGroup>
                          <IconButton
                            icon={Eye}
                            label="تفاصيل"
                            tone="brand"
                            onClick={() => setDetailAlert(row)}
                          />
                        </TableActionsGroup>
                      </td>
                    </tr>
                  ))
                )}
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

        <ManagerAlertDetailsModal
          open={Boolean(detailAlert)}
          alert={detailAlert}
          onClose={() => setDetailAlert(null)}
        />
      </div>
    </ManagerLayout>
  );
}
