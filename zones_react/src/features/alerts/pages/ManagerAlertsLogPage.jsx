import { useCallback, useEffect, useMemo, useState } from "react";
import { BellOff, Eye, Loader2, Plus } from "lucide-react";
import { zonesConfirm, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import TablePagination from "../../../shared/components/TablePagination";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import Button from "../../super-admin/components/ui/Button";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import {
  TableBulkActionBar,
  TableSelectHeaderCell,
  TableSelectRowCell,
  selectableRowClass,
} from "../../../shared/components/ui/TableSelection";
import {
  filterItemsByIds,
  resolveBulkActionIds,
  useTableSelection,
} from "../../../shared/hooks/useTableSelection";
import {
  alertTargetLabel,
  formatAlertRecordCode,
} from "../data/alertsMeta";
import {
  loadActiveAlerts,
  MANAGER_ALERTS_EVENT,
} from "../data/managerAlertsStorage";
import {
  archiveManagerAlert,
  archiveManagerAlerts,
  createManagerAlert,
} from "../utils/alertWorkflow";
import {
  fetchManagerAlerts,
  MANAGER_ALERTS_ARCHIVED_EVENT,
} from "../data/managerAlertsApi";
import { getActiveStaffSession, isApiStaffSession } from "../../devices-packages/data/hallCatalogSync";
import ManagerAlertDetailsModal from "../components/ManagerAlertDetailsModal";
import ManagerAlertFormModal from "../components/ManagerAlertFormModal";

const PAGE_SIZE = 8;
const ROW_FADE_MS = 280;

export default function ManagerAlertsLogPage() {
  const [alerts, setAlerts] = useState(() => loadActiveAlerts());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detailAlert, setDetailAlert] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [archivingIds, setArchivingIds] = useState(() => new Set());
  const [fadingIds, setFadingIds] = useState(() => new Set());

  const refresh = useCallback(async () => {
    const session = getActiveStaffSession();
    if (isApiStaffSession(session) && session.role === "manager") {
      const result = await fetchManagerAlerts({ status: "active" });
      if (result.ok) {
        setAlerts(result.alerts);
        return;
      }
    }
    setAlerts(loadActiveAlerts());
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

  const animateRemoveRows = (ids) => {
    if (!ids.length) return;
    setFadingIds((prev) => new Set([...prev, ...ids]));
    window.setTimeout(() => {
      setAlerts((prev) => prev.filter((row) => !ids.includes(row.id)));
      setFadingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }, ROW_FADE_MS);
  };

  const setArchiving = (ids, active) => {
    setArchivingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (active) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const runArchive = async (targetIds, rowForMessage) => {
    const isBulk = targetIds.length > 1;
    const targets = filterItemsByIds(alerts, targetIds);

    const confirmed = await zonesConfirm({
      title: isBulk ? `إيقاف ${targetIds.length} تنبيهات؟` : "إيقاف التنبيه؟",
      text: isBulk
        ? `سيتم إيقاف ${targetIds.length} تنبيهات ونقلها إلى الأرشيف — لا يمكن إعادة تفعيلها.`
        : `«${rowForMessage.name}» سيُوقَف ويُنقل إلى الأرشيف — لا يمكن إعادة تفعيله.`,
      icon: "warning",
      confirmText: "نعم، أوقف",
      cancelText: "إلغاء",
    });
    if (!confirmed) return;

    setArchiving(targetIds, true);

    const result = isBulk
      ? await archiveManagerAlerts(targets, targetIds)
      : await archiveManagerAlert(rowForMessage);

    setArchiving(targetIds, false);

    const archivedIds = isBulk
      ? (result.alerts || []).map((row) => row.id)
      : result.ok && result.alert
        ? [result.alert.id]
        : [];

    if (!archivedIds.length) return;

    selection.clearSelection();
    animateRemoveRows(archivedIds);

    zonesToastSuccess(
      isBulk
        ? `تم إيقاف ${result.success ?? archivedIds.length} من ${result.total ?? targetIds.length} تنبيهات ونقلها إلى الأرشيف`
        : "تم إيقاف التنبيه ونقله إلى الأرشيف",
    );
  };

  const handleArchiveAlert = (row) => runArchive(resolveBulkActionIds(row.id, selection.selectedIds), row);

  const handleBulkArchive = () => {
    const targets = filterItemsByIds(alerts, selection.selectedIds);
    if (!targets.length) return;
    runArchive(selection.selectedIds, targets[0]);
  };

  const handleSave = async (payload) => {
    const result = await createManagerAlert(payload);
    if (!result?.alert) return;
    selection.clearSelection();
    await refresh();
    setFormOpen(false);
    setPage(1);
  };

  return (
    <ManagerLayout>
      <div className="space-y-4" dir="rtl">
        <PageHeader
          title="سجل التنبيهات"
          description="التنبيهات النشطة فقط — عند الإيقاف تُنقل إلى الأرشيف."
        />

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">سجل التنبيهات</h2>
            <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
              {filtered.length} سجل
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
            <SearchBar
              containerClassName="min-w-[220px] flex-1 max-w-md"
              value={search}
              onChange={setSearch}
              placeholder="بحث برقم السجل أو اسم التنبيه..."
            />
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              إضافة تنبيه
            </Button>
          </div>

          <TableBulkActionBar
            count={selection.count}
            onClear={selection.clearSelection}
            actions={[{ label: "إيقاف المحدد", icon: BellOff, onClick: handleBulkArchive }]}
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] text-right text-xs">
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
                      لا توجد تنبيهات نشطة.
                    </td>
                  </tr>
                ) : (
                  paged.map((row) => {
                    const isArchiving = archivingIds.has(row.id);
                    const isFading = fadingIds.has(row.id);

                    return (
                      <tr
                        key={row.id}
                        className={`${selectableRowClass(selection.isSelected(row.id))} transition-all duration-300 ease-out ${
                          isFading ? "pointer-events-none scale-[0.98] opacity-0" : "scale-100 opacity-100"
                        }`}
                      >
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
                          —
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            نشطة
                          </span>
                        </td>
                        <td className={TABLE_ACTIONS_TD}>
                          <TableActionsGroup>
                            <IconButton
                              icon={Eye}
                              label="تفاصيل"
                              tone="brand"
                              disabled={isArchiving}
                              onClick={() => setDetailAlert(row)}
                            />
                            <IconButton
                              icon={isArchiving ? Loader2 : BellOff}
                              label={
                                selection.isSelected(row.id) && selection.count > 1
                                  ? `إيقاف ${selection.count} تنبيهات`
                                  : "إيقاف التنبيه"
                              }
                              tone="warning"
                              disabled={isArchiving}
                              className={isArchiving ? "[&_svg]:animate-spin" : ""}
                              onClick={() => handleArchiveAlert(row)}
                            />
                          </TableActionsGroup>
                        </td>
                      </tr>
                    );
                  })
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

        <ManagerAlertFormModal open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
      </div>
    </ManagerLayout>
  );
}
