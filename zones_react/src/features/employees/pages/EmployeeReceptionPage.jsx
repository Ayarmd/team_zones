import { useEffect, useMemo, useState } from "react";
import { UserCheck } from "lucide-react";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import TablePagination from "../../../shared/components/TablePagination";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import {
  StaffRowActions,
  StaffSearchToolbar,
  StaffStatusBadge,
} from "../components/EmployeeStaffTableHelpers";
import ReceptionStaffDetailsModal from "../components/ReceptionStaffDetailsModal";
import ReceptionStaffEditModal from "../components/ReceptionStaffEditModal";
import SendEmployeeInviteModal from "../components/SendEmployeeInviteModal";
import { formatDateAr, formatDateTimeAr, normalizeStatus } from "../data/employeeMeta";
import {
  EMPLOYEES_STORAGE_EVENT,
  archiveEmployee,
  filterEmployeesByRole,
  loadEmployees,
  saveEmployees,
} from "../data/employeesStorage";
import { confirmAction, toastSuccess } from "../utils/employeeConfirm";

const PAGE_SIZE = 5;

export default function EmployeeReceptionPage() {
  const [rows, setRows] = useState(loadEmployees);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState(null);
  const [editEmployee, setEditEmployee] = useState(null);

  useEffect(() => {
    const sync = () => setRows(loadEmployees());
    window.addEventListener(EMPLOYEES_STORAGE_EVENT, sync);
    return () => window.removeEventListener(EMPLOYEES_STORAGE_EVENT, sync);
  }, []);

  useEffect(() => {
    saveEmployees(rows);
  }, [rows]);

  const receptionStaff = useMemo(
    () => filterEmployeesByRole(rows, "reception", { archived: false }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return receptionStaff;
    return receptionStaff.filter(
      (e) =>
        e.fullName?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.phone?.includes(q),
    );
  }, [receptionStaff, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleArchive = async (row) => {
    const ok = await confirmAction({
      title: "أرشفة الموظف؟",
      text: `سيتم نقل «${row.fullName}» إلى واجهة الأرشفة ولن يظهر في قائمة الاستقبال.`,
      confirmText: "نعم، أرشف",
      danger: true,
    });
    if (!ok) return;
    const next = archiveEmployee(rows, row.id);
    setRows(next);
    await toastSuccess("تمت الأرشفة", "تم نقل الموظف إلى واجهة الأرشفة.");
  };

  return (
    <ManagerLayout title="موظفو الاستقبال">
      <div className="space-y-4" dir="rtl">
        <PageHeader title="استقبال" description="إدارة موظفي الاستقبال المرتبطين بالصالة" />

        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="إجمالي موظفي الاستقبال" value={receptionStaff.length} icon={UserCheck} />
          <KpiCard
            label="يعملون حالياً"
            value={receptionStaff.filter((e) => normalizeStatus(e.status) === "working").length}
            tone="green"
          />
          <KpiCard
            label="في إجازة"
            value={receptionStaff.filter((e) => normalizeStatus(e.status) === "leave").length}
            tone="amber"
          />
        </div>

        <StaffSearchToolbar
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onAddClick={() => setAddModalOpen(true)}
        />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-right text-xs">
              <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-extrabold text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">اسم الموظف</th>
                  <th className="px-4 py-3">البريد الإلكتروني</th>
                  <th className="px-4 py-3">رقم الهاتف</th>
                  <th className="px-4 py-3">تاريخ الانضمام</th>
                  <th className="px-4 py-3">آخر تسجيل دخول</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      لا يوجد موظفو استقبال مطابقون للبحث.
                    </td>
                  </tr>
                ) : (
                  paged.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-50 transition hover:bg-[#6B5478]/5 dark:border-gray-800/80"
                    >
                      <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-100">{row.fullName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                        {row.email}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                        {row.phone}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDateAr(row.joinDate)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDateTimeAr(row.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <StaffStatusBadge status={row.status} />
                      </td>
                      <td className={TABLE_ACTIONS_TD}>
                        <StaffRowActions
                          onDetails={() => setDetailEmployee(row)}
                          onEdit={() => setEditEmployee(row)}
                          onArchive={() => handleArchive(row)}
                        />
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
        onSaved={setRows}
      />
      <SendEmployeeInviteModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        defaultRole="reception"
      />
    </ManagerLayout>
  );
}
