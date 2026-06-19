import { useEffect, useState } from "react";
import { Gamepad2, Users, Wallet } from "lucide-react";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import { loadManagerHall } from "../../lounge/data/managerHallStorage";
import ManagerWorkHoursChart from "../components/ManagerWorkHoursChart";
import { workHoursData } from "../data/workHoursData";
import HallServicesManagerPicker from "../../lounge/components/HallServicesManagerPicker";
import { getManagerDashboardKpis, MANAGER_DASHBOARD_EVENTS } from "../data/managerDashboardData";

export default function DashboardPage() {
  const session = getAuthSession();
  const hall = loadManagerHall();
  const [kpis, setKpis] = useState(getManagerDashboardKpis);

  useEffect(() => {
    const refresh = () => setKpis(getManagerDashboardKpis());
    refresh();
    for (const eventName of MANAGER_DASHBOARD_EVENTS) {
      window.addEventListener(eventName, refresh);
    }
    window.addEventListener("focus", refresh);
    return () => {
      for (const eventName of MANAGER_DASHBOARD_EVENTS) {
        window.removeEventListener(eventName, refresh);
      }
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <ManagerLayout>
      <PageHeader
        title="لوحة التحكم"
        description={`مرحباً ${session?.fullName || "مدير الصالة"} — صالة ${hall.hallName}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="الأجهزة المتاحة (اليوم)"
          value={String(kpis.availableDevices)}
          hint={kpis.devicesHint}
          icon={Gamepad2}
          tone="green"
        />
        <KpiCard
          label="إيرادات اليوم"
          value={kpis.todayRevenueLabel}
          hint={kpis.revenueHint}
          icon={Wallet}
        />
        <KpiCard
          label="عدد الموظفين"
          value={String(kpis.employees)}
          hint={kpis.employeesHint}
          icon={Users}
          tone="amber"
        />
      </div>

      <ManagerWorkHoursChart data={workHoursData} />

      <div className="mt-6">
        <HallServicesManagerPicker compact />
      </div>
    </ManagerLayout>
  );
}
