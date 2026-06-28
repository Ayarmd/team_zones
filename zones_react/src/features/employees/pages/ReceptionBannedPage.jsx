import { useCallback, useEffect, useMemo, useState } from "react";
import { Unlock } from "lucide-react";
import { zonesConfirm, zonesToastError, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import Button from "../../super-admin/components/ui/Button";
import {
  BAN_DURATION_DAYS,
  CUSTOMER_BAN_EVENT,
  fetchReceptionBans,
  liftReceptionBan,
  NO_SHOW_BAN_THRESHOLD,
} from "../data/receptionBanApi";

function BanStatusBadge({ active, liftedAt }) {
  if (liftedAt) {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
        مُرفوع يدوياً
      </span>
    );
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        active
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {active ? "محظور" : "منتهٍ"}
    </span>
  );
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-LY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function customerLabel(row) {
  if (row.name?.trim()) return row.name.trim();
  if (row.phoneKey) return `زبون #${row.phoneKey.slice(-4)}`;
  return "—";
}

export default function ReceptionBannedPage() {
  const [bans, setBans] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBans = useCallback(async () => {
    setLoading(true);
    const result = await fetchReceptionBans();
    if (result.ok) {
      setBans(result.history);
    } else {
      zonesToastError(result.error || "تعذر تحميل قائمة المحظورين.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBans();
    window.addEventListener(CUSTOMER_BAN_EVENT, loadBans);
    window.addEventListener("focus", loadBans);
    const timer = setInterval(loadBans, 60_000);
    return () => {
      window.removeEventListener(CUSTOMER_BAN_EVENT, loadBans);
      window.removeEventListener("focus", loadBans);
      clearInterval(timer);
    };
  }, [loadBans]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bans;
    return bans.filter(
      (row) =>
        row.name?.toLowerCase().includes(q) ||
        row.phone?.includes(q) ||
        row.phoneKey?.includes(q.replace(/\D/g, "")),
    );
  }, [bans, search]);

  const activeCount = useMemo(() => bans.filter((b) => b.isActive).length, [bans]);

  const handleLiftBan = async (row) => {
    const confirmed = await zonesConfirm({
      title: "فك الحظر؟",
      text: `«${customerLabel(row)}» سيتمكن من الحجز عبر التطبيق فوراً.`,
      confirmText: "فك الحظر",
      cancelText: "إلغاء",
    });
    if (!confirmed) return;

    const result = await liftReceptionBan(row.id);
    if (!result.ok) {
      zonesToastError(result.error || "تعذر فك الحظر.");
      return;
    }
    await loadBans();
    zonesToastSuccess("يمكن للزبون الحجز من التطبيق مجدداً.", "تم فك الحظر");
  };

  return (
    <div dir="rtl" className="space-y-4">
      <PageHeader title="المحظورون" />

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">جدول المحظورين</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              حظر تلقائي بعد {NO_SHOW_BAN_THRESHOLD} غيابات — مدة {BAN_DURATION_DAYS} أيام — استخدم «فك الحظر» لإعادة
              التطبيق للزبون
            </p>
          </div>
          <span className="rounded-full bg-red-500/12 px-2.5 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
            {activeCount} محظور حالياً
          </span>
        </div>

        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <SearchBar
            containerClassName="max-w-md"
            value={search}
            onChange={setSearch}
            placeholder="بحث بالاسم أو رقم الهاتف..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-3 py-2.5 font-bold">الزبون</th>
                <th className="px-3 py-2.5 font-bold">الهاتف</th>
                <th className="px-3 py-2.5 font-bold">مرات No-Show</th>
                <th className="px-3 py-2.5 font-bold">تاريخ الحظر</th>
                <th className="px-3 py-2.5 font-bold">تاريخ انتهاء الحظر</th>
                <th className="px-3 py-2.5 font-bold">الحالة</th>
                <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-gray-400">
                    جاري التحميل...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-gray-400">
                    {search.trim() ? "لا توجد نتائج مطابقة للبحث." : "لا يوجد زبائن محظورون."}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      row.isActive ? "bg-red-500/[0.03]" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <span className="block font-bold text-gray-900 dark:text-white">{customerLabel(row)}</span>
                      {row.phoneKey ? (
                        <span className="mt-0.5 block text-[10px] font-semibold text-gray-400" dir="ltr">
                          معرّف: {row.phoneKey}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-200" dir="ltr">
                      {row.phone || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700 dark:text-amber-400">
                        {row.noShowCount ?? "—"} غياب
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{formatDateTime(row.bannedAt)}</td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{formatDateTime(row.bannedUntil)}</td>
                    <td className="px-3 py-3">
                      <BanStatusBadge active={row.isActive} liftedAt={row.liftedAt} />
                    </td>
                    <td className={TABLE_ACTIONS_TD}>
                      {row.isActive ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="success"
                          icon={Unlock}
                          onClick={() => handleLiftBan(row)}
                        >
                          فك الحظر
                        </Button>
                      ) : (
                        <span className="text-[10px] font-semibold text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
