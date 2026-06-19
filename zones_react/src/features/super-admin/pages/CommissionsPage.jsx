import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Percent } from "lucide-react";
import { zonesConfirm, zonesToastError, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import KpiCard from "../components/ui/KpiCard";
import PageHeader from "../components/ui/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import {
  COMMISSION_PAYMENT,
  COMMISSION_PAYMENT_LABELS,
} from "../data/commissionPaymentStatus";
import {
  getCommissionRows,
  getSuperAdminState,
  markHallCommissionPaid,
} from "../data/superAdminStorage";

const STATUS_FILTERS = [
  { key: "all", label: "كل الحالات" },
  { key: COMMISSION_PAYMENT.paid, label: COMMISSION_PAYMENT_LABELS.paid },
  { key: COMMISSION_PAYMENT.pending, label: COMMISSION_PAYMENT_LABELS.pending },
];

function paymentBadge(row) {
  if (row.paymentStatus === COMMISSION_PAYMENT.paid) {
    return {
      label: COMMISSION_PAYMENT_LABELS.paid,
      cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    };
  }

  return {
    label: COMMISSION_PAYMENT_LABELS.pending,
    cls: row.isOverdue
      ? "bg-red-500/15 text-red-600 dark:text-red-400"
      : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  };
}

export default function CommissionsPage() {
  const [rate, setRate] = useState(3);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const refresh = () => {
    const state = getSuperAdminState();
    setRate(state.systemSettings.globalCommissionRate);
    setRows(getCommissionRows());
  };

  useEffect(() => {
    refresh();
    window.addEventListener("super-admin-data-updated", refresh);
    return () => window.removeEventListener("super-admin-data-updated", refresh);
  }, []);

  const onMarkPaid = async (row) => {
    const ok = await zonesConfirm({
      title: "تسجيل الدفع؟",
      text: `تأكدت مع مدير «${row.hallName}» أن عمولة ${row.commission.toLocaleString("ar-LY")} د.ل دُفعت؟`,
      confirmText: "نعم، تم الدفع",
    });
    if (!ok) return;

    const result = markHallCommissionPaid(row.hallId);
    if (!result.ok) {
      zonesToastError(result.error || "تعذّر تسجيل الدفع.");
      return;
    }
    refresh();
    zonesToastSuccess("تم تسجيل الدفع");
  };

  const totalIncome = rows.reduce((s, r) => s + r.monthlyIncome, 0);
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.hallName.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || r.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  return (
    <div>
      <PageHeader title="المالية والعمولات" />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="إجمالي الدخل الشهري"
          value={`${totalIncome.toLocaleString("ar-LY")} د.ل`}
          icon={BarChart3}
          tone="green"
        />
        <KpiCard
          label="إجمالي العمولة"
          value={`${totalCommission.toLocaleString("ar-LY")} د.ل`}
          icon={Percent}
        />
        <KpiCard label="نسبة العمولة الحالية" value={`${rate}%`} icon={Percent} tone="amber" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
          <SearchBar
            containerClassName="min-w-48 flex-1 max-w-none"
            value={search}
            onChange={setSearch}
            placeholder="ابحث عن صالة..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-3 py-3 font-bold">اسم الصالة</th>
                <th className="px-3 py-3 font-bold">إجمالي الدخل الشهري</th>
                <th className="px-3 py-3 font-bold">نسبة العمولة</th>
                <th className="px-3 py-3 font-bold">قيمة العمولة</th>
                <th className="px-3 py-3 font-bold">موعد تحصيل العمولة</th>
                <th className="px-3 py-3 font-bold">حالة الدفع</th>
                <th className={TABLE_ACTIONS_TH}>الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRows.map((r) => {
                const badge = paymentBadge(r);
                const isPaid = r.paymentStatus === COMMISSION_PAYMENT.paid;

                return (
                  <tr key={r.hallId} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">{r.hallName}</td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                      {r.monthlyIncome.toLocaleString("ar-LY")} د.ل
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{r.rate}%</td>
                    <td className="px-3 py-3 font-extrabold text-[#6B5478]">
                      {r.commission.toLocaleString("ar-LY")} د.ل
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                      {r.dueDate}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className={TABLE_ACTIONS_TD}>
                      {isPaid ? (
                        <span className="text-[11px] font-semibold text-gray-400">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMarkPaid(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={13} />
                          تسجيل الدفع
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-gray-400">
                    لا توجد بيانات مطابقة.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
