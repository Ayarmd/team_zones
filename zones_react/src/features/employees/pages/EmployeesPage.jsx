import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Archive, Users, XCircle } from "lucide-react";
import TablePagination from "../../../shared/components/TablePagination";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import {
  TableSelectionModeBar,
  TableSelectHeaderCell,
  TableSelectRowCell,
  selectableRowClass,
} from "../../../shared/components/ui/TableSelection";
import {
  filterItemsByIds,
  resolveBulkActionIds,
  tableSelectColSpan,
} from "../../../shared/hooks/useTableSelection";
import { useTableSelectionMode } from "../../../shared/hooks/useTableSelectionMode";
import {
  StaffRowActions,
  StaffAddButton,
  StaffStatusBadge,
} from "../components/EmployeeStaffTableHelpers";
import StaffFilterSearchToolbar from "../../../shared/components/StaffFilterSearchToolbar";
import ReceptionStaffDetailsModal from "../components/ReceptionStaffDetailsModal";
import ReceptionStaffEditModal from "../components/ReceptionStaffEditModal";
import SendEmployeeInviteModal from "../components/SendEmployeeInviteModal";
import {
  formatDateAr,
  formatDateTimeAr,
  normalizeRole,
  normalizeStatus,
  roleLabel,
  shiftLabel,
} from "../data/employeeMeta";
import {
  EMPLOYEES_STORAGE_EVENT,
  archiveEmployee,
  loadEmployees,
  persistEmployeeArchiveApi,
  persistCancelInvitation,
  refreshEmployeesFromApi,
  saveEmployees,
} from "../data/employeesStorage";
import { confirmAction, toastSuccess } from "../utils/employeeConfirm";
import { zonesToastError, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";

const PAGE_SIZE = 8;
const TABLE_DATA_COLS = 8;
const ROLE_TABS = [
  { key: "all", label: "الكل" },
  { key: "reception", label: "استقبال" },
  { key: "maintenance", label: "صيانة" },
];

function PendingInviteBadge() {
  return (
    <span className="inline-flex rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-600 dark:text-sky-400">
      بانتظار التسجيل
    </span>
  );
}

export default function EmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleTab = searchParams.get("role") || "all";

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState(null);
  const [editEmployee, setEditEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const syncFromApi = async () => {
    setLoading(true);
    setLoadError("");
    const result = await refreshEmployeesFromApi();
    if (result.ok) {
      setRows(result.employees || []);
    } else if (!result.skipped) {
      setRows([]);
      setLoadError(result.error || "تعذر تحميل الموظفين من الخادم.");
      zonesToastError(result.error || "تعذر تحميل الموظفين من الخادم.");
    } else {
      setRows([]);
      setLoadError(result.error || "سجّل الدخول كمدير عبر الخادم.");
    }
    setLoading(false);
  };

  useEffect(() => {
    syncFromApi();
    const onUpdate = () => {
      syncFromApi();
    };
    window.addEventListener(EMPLOYEES_STORAGE_EVENT, onUpdate);
    return () => window.removeEventListener(EMPLOYEES_STORAGE_EVENT, onUpdate);
  }, []);

  const activeStaff = useMemo(
    () => rows.filter((e) => !e.isArchived),
    [rows],
  );

  const filteredByRole = useMemo(() => {
    if (roleTab === "all") return activeStaff;
    return activeStaff.filter((e) => normalizeRole(e.role) === roleTab);
  }, [activeStaff, roleTab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredByRole;
    return filteredByRole.filter(
      (e) =>
        e.fullName?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.phone?.includes(q) ||
        roleLabel(e.role).includes(q),
    );
  }, [filteredByRole, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds = useMemo(() => paged.map((row) => row.id), [paged]);
  const allIds = useMemo(() => filtered.map((row) => row.id), [filtered]);
  const selection = useTableSelectionMode({ items: filtered, pageIds, allIds });

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const setRoleTab = (key) => {
    setSearchParams(key === "all" ? {} : { role: key });
    setPage(1);
  };

  const runArchive = async (targetIds) => {
    const targets = filterItemsByIds(activeStaff, targetIds).filter((r) => !r.isPendingInvite);
    if (!targets.length) {
      zonesToastError("لا يمكن أرشفة دعوة بانتظار التسجيل");
      return;
    }

    const isBulk = targets.length > 1;
    const ok = await confirmAction({
      title: isBulk ? `أرشفة ${targets.length} موظفين؟` : "أرشفة الموظف؟",
      text: isBulk
        ? `سيتم إيقاف ${targets.length} حسابات مؤقتاً.`
        : `سيتم إيقاف حساب «${targets[0].fullName}» مؤقتاً.`,
      confirmText: "نعم، أرشف",
      danger: true,
    });
    if (!ok) return;

    const apiTargets = targets.filter((r) => r.userId);
    for (const row of apiTargets) {
      const result = await persistEmployeeArchiveApi(row);
      if (!result.ok) {
        zonesToastError(result.error || "تعذر أرشفة الموظف");
        await syncFromApi();
        return;
      }
    }

    let next = rows;
    for (const row of targets) {
      if (!row.userId) next = archiveEmployee(next, row.id);
    }

    if (apiTargets.length) {
      await syncFromApi();
    } else {
      setRows(next);
      saveEmployees(next);
    }

    selection.clearSelection();
    selection.exitSelectionMode();
    await toastSuccess(
      "تمت الأرشفة",
      isBulk ? `تم أرشفة ${targets.length} موظفين.` : "تم تحديث حالة الموظف.",
    );
  };

  const handleArchive = (row) => runArchive(resolveBulkActionIds(row.id, selection.selectedIds));

  const handleBulkArchive = () => {
    if (!selection.selectedIds.length) return;
    runArchive(selection.selectedIds);
  };

  const runCancelInvite = async (targetIds) => {
    const targets = filterItemsByIds(activeStaff, targetIds).filter((r) => r.isPendingInvite);
    if (!targets.length) return;

    const isBulk = targets.length > 1;
    const ok = await confirmAction({
      title: isBulk ? `إلغاء ${targets.length} دعوات؟` : "إلغاء الدعوة؟",
      text: isBulk
        ? `سيتم حذف ${targets.length} دعوات بانتظار التسجيل.`
        : `سيتم حذف دعوة «${targets[0].fullName}» (${targets[0].email}) لتتمكن من إرسال بريد جديد.`,
      confirmText: "إلغاء الدعوة",
      danger: true,
    });
    if (!ok) return;

    for (const row of targets) {
      const result = await persistCancelInvitation(row);
      if (!result.ok) {
        zonesToastError(result.error || "تعذر إلغاء الدعوة");
        return;
      }
    }

    await syncFromApi();
    selection.clearSelection();
    selection.exitSelectionMode();
    zonesToastSuccess(isBulk ? `تم إلغاء ${targets.length} دعوات` : "تم إلغاء الدعوة");
  };

  const handleCancelInvite = (row) => runCancelInvite(resolveBulkActionIds(row.id, selection.selectedIds));

  const handleBulkCancelInvite = () => {
    if (!selection.selectedIds.length) return;
    runCancelInvite(selection.selectedIds);
  };

  const onInviteSent = (result) => {
    if (result.mailSent) {
      zonesToastSuccess(result.message || "تم إرسال الدعوة بالبريد");
    } else {
      zonesToastSuccess(result.message || "تم إنشاء الدعوة");
    }
    syncFromApi();
  };

  return (
    <>
    <div className="space-y-4" dir="rtl">
        <PageHeader title="الموظفين" />

        {loadError ? (
          <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {loadError}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="إجمالي الموظفين" value={activeStaff.length} icon={Users} />
          <KpiCard
            label="موظفو الاستقبال"
            value={activeStaff.filter((e) => normalizeRole(e.role) === "reception").length}
            tone="green"
          />
          <KpiCard
            label="موظفو الصيانة"
            value={activeStaff.filter((e) => normalizeRole(e.role) === "maintenance").length}
            tone="amber"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <StaffFilterSearchToolbar
            filters={ROLE_TABS}
            activeFilter={roleTab}
            onFilterChange={setRoleTab}
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="بحث بالاسم أو البريد أو الهاتف..."
            filterAriaLabel="تصفية الموظفين"
            actions={<StaffAddButton onClick={() => setAddModalOpen(true)} />}
            embedded
          />
          <TableSelectionModeBar
            selectionMode={selection.selectionMode}
            onEnter={selection.enterSelectionMode}
            onExit={selection.exitSelectionMode}
            count={selection.count}
            totalCount={filtered.length}
            onClear={selection.clearSelection}
            actions={[
              { label: "أرشفة المحدد", icon: Archive, onClick: handleBulkArchive, variant: "dangerOutline" },
              { label: "إلغاء الدعوات المحددة", icon: XCircle, onClick: handleBulkCancelInvite, variant: "danger" },
            ]}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-right text-xs">
              <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-extrabold text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>
                  <TableSelectHeaderCell {...selection} />
                  <th className="px-4 py-3">اسم الموظف</th>
                  <th className="px-4 py-3">البريد الإلكتروني</th>
                  <th className="px-4 py-3">الصلاحية</th>
                  <th className="px-4 py-3">توقيت الدوام</th>
                  <th className="px-4 py-3">تاريخ الانضمام</th>
                  <th className="px-4 py-3">آخر تسجيل دخول</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={tableSelectColSpan(TABLE_DATA_COLS, selection.selectionMode)} className="px-4 py-10 text-center text-gray-400">
                      جاري تحميل الموظفين...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={tableSelectColSpan(TABLE_DATA_COLS, selection.selectionMode)} className="px-4 py-10 text-center text-gray-500">
                      لا يوجد موظفين مطابقون.
                    </td>
                  </tr>
                ) : (
                  paged.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        selection.selectionMode
                          ? selectableRowClass(
                              selection.isSelected(row.id),
                              "border-b border-gray-50 transition hover:bg-[#6B5478]/5 dark:border-gray-800/80",
                            )
                          : "border-b border-gray-50 transition hover:bg-[#6B5478]/5 dark:border-gray-800/80"
                      }
                    >
                      <TableSelectRowCell id={row.id} ariaLabel={`تحديد ${row.fullName}`} {...selection} />
                      <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-100">
                        {row.fullName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                        {row.email}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {roleLabel(row.role)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {shiftLabel(row.shift)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatDateAr(row.joinDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatDateTimeAr(row.lastLogin)}
                      </td>
                      <td className="px-4 py-3">
                        {row.isPendingInvite ? (
                          <PendingInviteBadge />
                        ) : (
                          <StaffStatusBadge status={row.status} />
                        )}
                      </td>
                      <td className={TABLE_ACTIONS_TD}>
                        {row.isPendingInvite ? (
                          <button
                            type="button"
                            onClick={() => handleCancelInvite(row)}
                            className="rounded-lg border border-red-300 px-3 py-1.5 text-[10px] font-bold text-red-600 dark:border-red-800 dark:text-red-400"
                          >
                            {selection.isSelected(row.id) && selection.count > 1
                              ? `إلغاء ${selection.count} دعوات`
                              : "إلغاء الدعوة"}
                          </button>
                        ) : (
                          <StaffRowActions
                            onDetails={() => setDetailEmployee(row)}
                            onEdit={() => setEditEmployee(row)}
                            onArchive={() => handleArchive(row)}
                          />
                        )}
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
        </div>
      </div>

      <ReceptionStaffDetailsModal
        open={Boolean(detailEmployee)}
        employee={detailEmployee}
        onClose={() => setDetailEmployee(null)}
      />
      <ReceptionStaffEditModal
        open={Boolean(editEmployee)}
        employee={editEmployee}
        employees={rows}
        onClose={() => setEditEmployee(null)}
        onSaved={(next) => {
          setRows(next);
          syncFromApi();
        }}
      />
      <SendEmployeeInviteModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSent={onInviteSent}
      />
    </>
  );
}
