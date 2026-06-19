import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  Gamepad2,
  MapPin,
  Package,
  Pencil,
  Phone,
  Users,
} from "lucide-react";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import { formatHallWorkHours, getHallStatusMeta, loadManagerHall } from "../data/managerHallStorage";
import { useHallStats } from "../hooks/useHallStats";
import HallServicesManagerPicker from "../components/HallServicesManagerPicker";

const STATUS_BADGE = {
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  red: "bg-red-500/15 text-red-600 dark:text-red-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

function InfoRow({ icon: Icon, label, value, ltr, isLink }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-3 text-xs last:border-0 dark:border-gray-800">
      <span className="flex shrink-0 items-center gap-1.5 font-semibold text-gray-500 dark:text-gray-400">
        <Icon size={14} className="text-[#6B5478]" />
        {label}
      </span>
      {isLink && value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 font-bold text-[#6B5478]"
          dir="ltr"
        >
          فتح الرابط <ExternalLink size={12} />
        </a>
      ) : (
        <span className="text-left font-bold text-gray-800 dark:text-gray-100" dir={ltr ? "ltr" : undefined}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}

export default function LoungeManagementPage() {
  const [hall, setHall] = useState(loadManagerHall);
  const { deviceCount, packageCount, employeeCount } = useHallStats();

  useEffect(() => {
    const refresh = () => setHall(loadManagerHall());
    window.addEventListener("manager-hall-updated", refresh);
    return () => window.removeEventListener("manager-hall-updated", refresh);
  }, []);

  const statusMeta = getHallStatusMeta(hall.status);

  return (
    <ManagerLayout>
      <PageHeader
        title="بيانات الصالة"
        description="عرض معلومات صالتك المسجّلة في المنصة."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="عدد الأجهزة"
          value={deviceCount}
          hint="يُحدَّث تلقائياً عند الإضافة أو الحذف"
          icon={Gamepad2}
          tone="primary"
        />
        <KpiCard
          label="عدد الباقات"
          value={packageCount}
          hint="يُحدَّث تلقائياً عند الإضافة أو الحذف"
          icon={Package}
          tone="green"
        />
        <KpiCard
          label="عدد الموظفين"
          value={employeeCount}
          hint="يُحدَّث تلقائياً عند الإضافة أو الحذف"
          icon={Users}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
              <Building2 size={16} className="text-[#6B5478]" />
              معلومات الصالة
            </h2>
            <Link
              to="/lounge/edit"
              className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-1.5 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Pencil size={13} /> تعديل
            </Link>
          </div>

          <div className="rounded-xl border border-gray-100 px-4 py-1 dark:border-gray-800">
            <InfoRow icon={Building2} label="اسم الصالة" value={hall.hallName} />
            <InfoRow icon={Building2} label="نوع الصالة" value={hall.hallType} />
            <InfoRow icon={MapPin} label="المدينة" value={hall.city} />
            <InfoRow icon={MapPin} label="العنوان" value={hall.address} />
            <InfoRow icon={ExternalLink} label="الموقع (رابط الخريطة)" value={hall.mapLink} isLink />
            <InfoRow icon={Users} label="عدد الموظفين" value={`${employeeCount} موظف`} />
            <InfoRow icon={CalendarDays} label="تاريخ الانضمام" value={hall.joinDate?.replaceAll("-", "/")} ltr />
            <div className="flex items-center justify-between gap-3 py-3 text-xs">
              <span className="font-semibold text-gray-500 dark:text-gray-400">حالة الصالة</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_BADGE[statusMeta.color]}`}>
                {statusMeta.label}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            حالة الصالة وتاريخ الانضمام يحدّدهما النظام والإدارة — لا يمكن تعديلهما من هنا.
          </p>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
              <Phone size={16} className="text-[#6B5478]" />
              التواصل والتشغيل
            </h2>
            <div className="rounded-xl border border-gray-100 px-4 py-1 dark:border-gray-800">
              <InfoRow icon={Phone} label="الهاتف" value={hall.phone} ltr />
              <InfoRow
                icon={Clock}
                label="ساعات العمل"
                value={formatHallWorkHours(hall.workHoursFrom, hall.workHoursTo)}
                ltr
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-sm font-extrabold text-gray-900 dark:text-white">صورة الصالة</h2>
            <img
              src={hall.image}
              alt={hall.hallName}
              className="h-44 w-full rounded-2xl object-cover ring-1 ring-gray-200 dark:ring-gray-700"
            />
            <p className="mt-3 text-center text-xs font-bold text-gray-700 dark:text-gray-200">{hall.hallName}</p>
            <p className="mt-1 text-center text-[11px] text-gray-500">{hall.city}</p>
          </section>
        </div>
      </div>

      <div className="mt-4">
        <HallServicesManagerPicker />
      </div>
    </ManagerLayout>
  );
}
