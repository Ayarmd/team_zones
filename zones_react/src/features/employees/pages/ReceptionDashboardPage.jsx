import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CalendarDays, Monitor, Package, Play, Tag, Trophy } from "lucide-react";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import { getReceptionProfileBundle } from "../data/receptionEmployeeProfileData";
import {
  getReceptionDashboardView,
  RECEPTION_DASHBOARD_EVENTS,
} from "../data/receptionDashboardData";
import { RECEPTION_EMPLOYEE_ROUTES } from "../data/receptionEmployeeRoutes";
import IconGlyph from "../../../shared/components/ui/IconGlyph";
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

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-extrabold text-gray-900 dark:text-white">اختصارات سريعة</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "تقويم الحجوزات", path: RECEPTION_EMPLOYEE_ROUTES.reservationsCalendar, icon: CalendarDays },
            { label: "الجلسات", path: RECEPTION_EMPLOYEE_ROUTES.reservationsSession, icon: Play },
            { label: "جميع الأجهزة", path: RECEPTION_EMPLOYEE_ROUTES.devices, icon: Monitor },
            { label: "الأجهزة المعطلة", path: RECEPTION_EMPLOYEE_ROUTES.devicesBroken, icon: Monitor },
            { label: "الباقات", path: RECEPTION_EMPLOYEE_ROUTES.packages, icon: Package },
            { label: "العروض", path: RECEPTION_EMPLOYEE_ROUTES.offers, icon: Tag },
            { label: "عرض البطولات", path: RECEPTION_EMPLOYEE_ROUTES.tournaments, icon: Trophy },
            { label: "بيانات البطولة", path: RECEPTION_EMPLOYEE_ROUTES.tournamentsData, icon: Trophy },
            { label: "قائمة المشاركين", path: RECEPTION_EMPLOYEE_ROUTES.tournamentsParticipants, icon: Trophy },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-700 transition hover:border-[#6B5478]/30 hover:bg-[#6B5478]/5 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-[#6B5478]/10"
              >
                <IconGlyph icon={Icon} tone="primary" size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
