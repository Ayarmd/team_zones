import { useEffect, useState } from "react";
import { CalendarClock, Monitor, Play } from "lucide-react";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import { getReceptionProfileBundle } from "../data/receptionEmployeeProfileData";
import {
  getReceptionDashboardView,
  RECEPTION_DASHBOARD_EVENTS,
} from "../data/receptionDashboardData";
import ReceptionDailyBookingsChart from "../components/ReceptionDailyBookingsChart";

export default function ReceptionDashboardPage() {
  const session = getAuthSession();
  const { hallName } = getReceptionProfileBundle();
  const [view, setView] = useState(getReceptionDashboardView);

  useEffect(() => {
    const refresh = () => setView(getReceptionDashboardView());
    refresh();
    RECEPTION_DASHBOARD_EVENTS.forEach((ev) => window.addEventListener(ev, refresh));
    window.addEventListener("focus", refresh);
    return () => {
      RECEPTION_DASHBOARD_EVENTS.forEach((ev) => window.removeEventListener(ev, refresh));
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const { kpis, dailyBookingsChart } = view;

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        description={`مرحباً ${session?.fullName || "موظف الاستقبال"} — صالة ${hallName}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="جلسات اليوم"
          value={String(kpis.todaySessions)}
          hint={`${view.activeSessions} جلسة نشطة الآن`}
          icon={Play}
        />
        <KpiCard
          label="حجوزات نشطة"
          value={String(kpis.todayBookings)}
          hint={`${view.openBookings} حجز مفتوح`}
          icon={CalendarClock}
          tone="amber"
        />
        <KpiCard
          label="أجهزة متاحة"
          value={String(kpis.availableDevices)}
          hint="جاهزة للحجز"
          icon={Monitor}
          tone="green"
        />
      </div>

      <ReceptionDailyBookingsChart data={dailyBookingsChart} />
    </div>
  );
}
