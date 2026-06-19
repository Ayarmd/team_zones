import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Wrench } from "lucide-react";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import { DEVICES_STORAGE_EVENT } from "../../devices-packages/data/devicesStorage";
import { MAINTENANCE_FAULTS_EVENT } from "../../maintenance/data/maintenanceFaultsStorage";
import { reconcileDisabledDevicesWithoutFaults } from "../../maintenance/utils/maintenanceWorkflow";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import MaintenanceFaultReasonsChart from "../components/MaintenanceFaultReasonsChart";
import MaintenanceDashboardFaultsTable from "../components/MaintenanceDashboardFaultsTable";
import {
  buildFaultReasonBreakdown,
  getMaintenanceDashboardTableRows,
  getMaintenanceDashboardView,
} from "../data/maintenanceDashboardData";

const KPI_FILTERS = [
  { key: "waiting", label: "في الانتظار", hint: "بانتظار بدء الإصلاح", icon: Clock, tone: "red", kpiKey: "waitingFaults" },
  { key: "inProgress", label: "قيد الإصلاح", hint: "جاري العمل عليها", icon: Wrench, tone: "amber", kpiKey: "inProgressFaults" },
  { key: "resolved", label: "تم الإصلاح", hint: "في السجل", icon: CheckCircle2, tone: "green", kpiKey: "resolvedFaults" },
];

export default function MaintenanceDashboardPage() {
  const session = getAuthSession();
  const [view, setView] = useState(getMaintenanceDashboardView);
  const [activeFilter, setActiveFilter] = useState(null);

  const refresh = () => {
    reconcileDisabledDevicesWithoutFaults();
    setView(getMaintenanceDashboardView());
  };

  useEffect(() => {
    refresh();
    window.addEventListener(DEVICES_STORAGE_EVENT, refresh);
    window.addEventListener(MAINTENANCE_FAULTS_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(DEVICES_STORAGE_EVENT, refresh);
      window.removeEventListener(MAINTENANCE_FAULTS_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const reasonBreakdown = useMemo(() => buildFaultReasonBreakdown(), [view]);
  const tableRows = useMemo(
    () => (activeFilter ? getMaintenanceDashboardTableRows(activeFilter) : []),
    [activeFilter, view],
  );
  const { kpis } = view;
  const hasReasonData = reasonBreakdown.length > 0;

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="لوحة التحكم"
        description={`مرحباً ${session?.fullName || "موظف الصيانة"} — متابعة الأعطال والإصلاحات`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {KPI_FILTERS.map((item) => {
          const isActive = activeFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveFilter(item.key)}
              className={`w-full rounded-2xl text-right transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B5478] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 ${
                isActive ? "ring-2 ring-[#6B5478] ring-offset-2 dark:ring-offset-gray-950" : "hover:opacity-95"
              }`}
            >
              <KpiCard
                label={item.label}
                value={String(kpis[item.kpiKey])}
                icon={item.icon}
                tone={item.tone}
                hint={item.hint}
              />
            </button>
          );
        })}
      </div>

      {hasReasonData ? (
        <MaintenanceFaultReasonsChart data={reasonBreakdown} />
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-400">لا توجد أعطال نشطة لعرض أسباب الأعطال.</p>
        </section>
      )}

      {activeFilter ? <MaintenanceDashboardFaultsTable filter={activeFilter} rows={tableRows} /> : null}
    </div>
  );
}
