import { useEffect, useMemo, useState } from "react";
import { zonesConfirm, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import TablePagination from "../../../shared/components/TablePagination";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import Button from "../../super-admin/components/ui/Button";
import ExpenseFormModal from "../components/ExpenseFormModal";
import ExpenseRowActions from "../components/ExpenseRowActions";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import {
  formatExpenseAmount,
  formatExpenseDate,
  paymentStatusLabel,
} from "../data/expenseMeta";
import {
  EXPENSES_STORAGE_EVENT,
  loadExpenses,
  saveExpenses,
} from "../data/expensesStorage";

const PAGE_SIZE = 8;

function PaymentBadge({ isPaid }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        isPaid
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      }`}
    >
      {paymentStatusLabel(isPaid)}
    </span>
  );
}

export default function ExpensesPage() {
  const [rows, setRows] = useState(loadExpenses);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [activeRow, setActiveRow] = useState(null);

  useEffect(() => {
    saveExpenses(rows);
  }, [rows]);

  useEffect(() => {
    const sync = () => setRows(loadExpenses());
    window.addEventListener(EXPENSES_STORAGE_EVENT, sync);
    return () => window.removeEventListener(EXPENSES_STORAGE_EVENT, sync);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name?.includes(q) ||
        r.notes?.includes(q) ||
        String(r.amount).includes(q) ||
        paymentStatusLabel(r.isPaid).includes(q),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openAdd = () => {
    setActiveRow(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setActiveRow({ ...row });
    setModalMode("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveRow(null);
    setModalMode("add");
  };

  const handleSave = (patch) => {
    if (modalMode === "add") {
      const nid = Math.max(0, ...rows.map((r) => r.id)) + 1;
      const row = { id: nid, ...patch };
      setRows((list) => [...list, row]);
    } else if (activeRow) {
      setRows((list) =>
        list.map((r) => (r.id === activeRow.id ? { ...r, ...patch } : r)),
      );
    }
    closeModal();
    zonesToastSuccess("تم الحفظ");
  };

  const handleDelete = async (row) => {
    const ok = await zonesConfirm({
      title: "حذف المصروف؟",
      text: `سيتم حذف «${row.name || "—"}».`,
      icon: "warning",
      confirmText: "حذف",
      cancelText: "تراجع",
      danger: true,
    });
    if (!ok) return;
    setRows((list) => list.filter((r) => r.id !== row.id));
    zonesToastSuccess("تم الحذف");
  };

  return (
    <ManagerLayout>
      <PageHeader
        title="بيانات المصروف"
        description="إدارة مصروفات الصالة — تُخصم تلقائياً عند احتساب الأرباح."
      />

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">قائمة المصروفات</h2>
          <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
            {filtered.length} مصروف
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <SearchBar value={search} onChange={setSearch} placeholder="بحث عن مصروف..." />
          <Button size="sm" onClick={openAdd}>
            + إضافة مصروف
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-3 py-2.5 font-bold">اسم المصروف</th>
                <th className="px-3 py-2.5 font-bold">المبلغ</th>
                <th className="px-3 py-2.5 font-bold">حالة الدفع</th>
                <th className="px-3 py-2.5 font-bold">تاريخ الإضافة</th>
                <th className="px-3 py-2.5 font-bold">تاريخ الدفع</th>
                <th className="px-3 py-2.5 font-bold">ملاحظات</th>
                <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paged.map((row) => (
                <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">
                    {row.name || "—"}
                  </td>
                  <td className="px-3 py-3 font-bold text-[#6B5478]">{formatExpenseAmount(row.amount)}</td>
                  <td className="px-3 py-3">
                    <PaymentBadge isPaid={row.isPaid} />
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                    {formatExpenseDate(row.addedAt)}
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                    {row.isPaid && row.paidAt ? formatExpenseDate(row.paidAt) : "—"}
                  </td>
                  <td className="max-w-[200px] px-3 py-3 text-gray-600 dark:text-gray-300">
                    <span className="line-clamp-2">{row.notes?.trim() ? row.notes : "—"}</span>
                  </td>
                  <td className={TABLE_ACTIONS_TD}>
                    <ExpenseRowActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} />
                  </td>
                </tr>
              ))}
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-gray-400">
                    لا توجد مصروفات مطابقة.
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

      <ExpenseFormModal
        open={modalOpen}
        mode={modalMode}
        expense={activeRow}
        onClose={closeModal}
        onSave={handleSave}
      />
    </ManagerLayout>
  );
}
