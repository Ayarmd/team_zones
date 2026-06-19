import { Gamepad2, Users, Wallet } from "lucide-react";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import { loadManagerHall } from "../../lounge/data/managerHallStorage";
import ManagerWorkHoursChart from "../components/ManagerWorkHoursChart";
import { workHoursData } from "../data/workHoursData";
import HallServicesManagerPicker from "../../lounge/components/HallServicesManagerPicker";

export default function DashboardPage() {
  const session = getAuthSession();
  const hall = loadManagerHall();

  return (
    <ManagerLayout>
      <PageHeader
        title="لوحة التحكم"
        description={`مرحباً ${session?.fullName || "مدير الصالة"} — صالة ${hall.hallName}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="إجمالي الأجهزة (اليوم)"
          value="48"
          hint="+5 عن أمس"
          icon={Gamepad2}
          tone="green"
        />
        <KpiCard
          label="إيرادات اليوم"
          value="8,750 د.ل"
          hint="+12% عن أمس"
          icon={Wallet}
        />
        <KpiCard
          label="عدد الموظفين"
          value="24"
          hint="+2 عن أمس"
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
