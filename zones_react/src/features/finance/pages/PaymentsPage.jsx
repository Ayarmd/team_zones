import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import TablePagination from "../../../shared/components/TablePagination";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import PaymentsDateFilter, {
  localTodayIso,
  shiftLocalIsoDate,
} from "../components/PaymentsDateFilter";
import {
  PAYMENT_METHOD_FILTERS,
  fetchManagerPayments,
  formatBookingDetails,
  formatPaymentAmount,
  formatPaymentDateTime,
  paymentMethodLabel,
} from "../data/paymentMeta";

const PAGE_SIZE = 10;

function PaymentMethodBadge({ method }) {
  const isElectronic = method === "electronic";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        isElectronic
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      }`}
    >
      {paymentMethodLabel(method)}
    </span>
  );
}

export default function PaymentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(localTodayIso);
  const [showAll, setShowAll] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await fetchManagerPayments({
      paymentMethod: methodFilter,
      date: showAll ? null : selectedDate,
      showAll,
    });

    if (result.ok) {
      setRows(result.payments);
    } else {
      setRows([]);
      setError(result.error || "تعذّر تحميل المدفوعات");
    }
    setLoading(false);
  }, [methodFilter, selectedDate, showAll]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleDateChange = (value) => {
    if (!value) return;
    setShowAll(false);
    setSelectedDate(value);
  };

  const handleShowAllToggle = () => {
    if (showAll) {
      setShowAll(false);
      setSelectedDate(localTodayIso());
    } else {
      setShowAll(true);
    }
  };

  const handlePrevDay = () => {
    setShowAll(false);
    setSelectedDate((current) => shiftLocalIsoDate(current, -1));
  };

  const handleNextDay = () => {
    setShowAll(false);
    setSelectedDate((current) => shiftLocalIsoDate(current, 1));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      const haystack = [
        row.transactionRef,
        row.customerName,
        row.bookingNumber,
        formatBookingDetails(row),
        paymentMethodLabel(row.paymentMethod),
        String(row.amount),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, methodFilter, selectedDate, showAll]);

  return (
    <ManagerLayout>
      <PageHeader title="المدفوعات" subtitle="سجل المعاملات المالية المكتملة" />

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="relative z-30 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:items-center xl:gap-5">
            <div className="flex flex-wrap items-center gap-2">
              {PAYMENT_METHOD_FILTERS.map((filter) => {
                const active = methodFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setMethodFilter(filter.key)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-[#6B5478] text-white shadow-sm"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <PaymentsDateFilter
                selectedDate={selectedDate}
                showAll={showAll}
                onDateChange={handleDateChange}
                onShowAll={handleShowAllToggle}
                onPrevDay={handlePrevDay}
                onNextDay={handleNextDay}
              />
            </div>

            <div className="w-full xl:max-w-[300px] xl:justify-self-end">
              <SearchBar value={search} onChange={setSearch} placeholder="بحث في المدفوعات..." />
            </div>
          </div>
        </div>

        <div className="relative">
          {loading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-gray-900/70">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                <Loader2 size={16} className="animate-spin text-[#6B5478]" />
                جاري التحميل...
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-4 py-3 font-bold">رقم المعاملة</th>
                  <th className="px-4 py-3 font-bold">العميل</th>
                  <th className="px-4 py-3 font-bold">الحجز</th>
                  <th className="px-4 py-3 font-bold">المبلغ</th>
                  <th className="px-4 py-3 font-bold">طريقة الدفع</th>
                  <th className="px-4 py-3 font-bold">تاريخ الدفع</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-100 dark:divide-gray-800 ${loading ? "opacity-50" : ""}`}>
                {error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-red-500 dark:text-red-400">
                      {error}
                    </td>
                  </tr>
                ) : !loading && paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      {showAll ? "لا توجد مدفوعات مطابقة" : "لا توجد مدفوعات في هذا اليوم"}
                    </td>
                  </tr>
                ) : (
                  paged.map((row) => (
                    <tr
                      key={row.id}
                      className="text-gray-800 transition-colors hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-500 dark:text-gray-400">
                        {row.transactionRef || `#${row.id}`}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-100">
                        {row.customerName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatBookingDetails(row)}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#6B5478]">
                        {formatPaymentAmount(row.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentMethodBadge method={row.paymentMethod} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatPaymentDateTime(row.paidAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && filtered.length > 0 ? (
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </section>
    </ManagerLayout>
  );
}
