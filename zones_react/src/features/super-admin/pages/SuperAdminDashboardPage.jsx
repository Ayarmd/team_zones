import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Eye, UserPlus } from "lucide-react";
import IconGlyph from "../../../shared/components/ui/IconGlyph";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import PlatformSummaryPanel from "../components/PlatformSummaryPanel";
import { getSuperAdminSession } from "../data/superAdminAuth";
import { getDashboardView } from "../data/superAdminDashboardData";
import { SUPER_ADMIN_ROUTES } from "../data/superAdminConstants";

function KpiCard({ icon: Icon, iconTone = "primary", label, value, hint, hintCls }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-gray-900 dark:text-white">{value}</p>
        </div>
        {Icon ? <IconGlyph icon={Icon} tone={iconTone} size={20} /> : null}
      </div>
      {hint ? <p className={`mt-2 text-[11px] font-semibold ${hintCls || "text-gray-400"}`}>{hint}</p> : null}
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  const session = getSuperAdminSession();
  const navigate = useNavigate();
  const [view, setView] = useState(getDashboardView());

  useEffect(() => {
    const refresh = () => setView(getDashboardView());
    refresh();
    window.addEventListener("super-admin-data-updated", refresh);
    return () => window.removeEventListener("super-admin-data-updated", refresh);
  }, []);

  const { kpis, platformSummary, recentRequests } = view;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">
          مرحباً بك، {session?.fullName || "الأدمن العام"} <span>👋</span>
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          icon={Building2}
          iconTone="primary"
          label="الصالات النشطة"
          value={kpis.activeHalls}
          hint="صالة نشطة على المنصة"
        />
        <KpiCard
          icon={UserPlus}
          iconTone="amber"
          label="الطلبات المعلقة"
          value={kpis.pendingRequests}
          hint="طلب انضمام بانتظار المراجعة"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
              <UserPlus size={16} className="text-[#6B5478]" />
              طلبات الانضمام الأخيرة
            </h2>
            <Link to={SUPER_ADMIN_ROUTES.pending} className="text-[11px] font-bold text-[#6B5478]">
              عرض كل الطلبات
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-4 py-2.5 font-bold">اسم الصالة</th>
                  <th className="px-4 py-2.5 font-bold">المدينة</th>
                  <th className="px-4 py-2.5 font-bold">الهاتف التجاري</th>
                  <th className="px-4 py-2.5 font-bold">حالة الطلب</th>
                  <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      لا توجد طلبات معلقة حالياً.
                    </td>
                  </tr>
                ) : null}
                {recentRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-100">{r.hallName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.city}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                      {r.phone}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        {r.status}
                      </span>
                    </td>
                    <td className={TABLE_ACTIONS_TD}>
                      <TableActionsGroup>
                        <IconButton
                          icon={Eye}
                          label="عرض التفاصيل"
                          tone="brand"
                          onClick={() => navigate(SUPER_ADMIN_ROUTES.pending)}
                        />
                      </TableActionsGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <PlatformSummaryPanel summary={platformSummary} />
      </div>
    </div>
  );
}
