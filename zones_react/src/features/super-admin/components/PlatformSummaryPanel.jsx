import { Link } from "react-router-dom";
import { ArrowLeft, Briefcase, Headphones, Users, Wrench } from "lucide-react";
import IconGlyph from "../../../shared/components/ui/IconGlyph";
import { cn } from "../../../lib/utils";
import { SUPER_ADMIN_ROUTES } from "../data/superAdminConstants";

function StatTile({ icon: Icon, tone, label, value }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-4 text-center dark:border-gray-800 dark:bg-gray-800/40">
      <IconGlyph icon={Icon} tone={tone} size={18} />
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export default function PlatformSummaryPanel({ summary }) {
  const formattedCommission = summary.expectedCommission.toLocaleString("ar-LY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-l from-[#6B5478]/8 to-transparent px-5 py-4 dark:border-gray-800 dark:from-[#6B5478]/15">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
          <Users size={16} className="text-[#6B5478]" />
          ملخص المنصة
        </h2>
        <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-1 text-[10px] font-bold text-[#6B5478] dark:text-[#c4b5d0]">
          {summary.monthLabel}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={Briefcase} tone="primary" label="مدير صالة" value={summary.activeManagers} />
          <StatTile icon={Headphones} tone="green" label="موظف استقبال" value={summary.activeReception} />
          <StatTile icon={Wrench} tone="amber" label="موظف صيانة" value={summary.activeMaintenance} />
        </div>

        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-[#6B5478]/20 p-4",
            "bg-gradient-to-br from-[#6B5478]/10 via-[#6B5478]/5 to-transparent",
            "dark:border-[#6B5478]/30 dark:from-[#6B5478]/20 dark:via-[#6B5478]/10",
          )}
        >
          <div className="pointer-events-none absolute -start-6 -top-6 h-24 w-24 rounded-full bg-[#6B5478]/10 blur-2xl" />
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">إجمالي عمولات الشهر المتوقعة</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <span className="text-3xl font-extrabold tabular-nums text-[#6B5478] dark:text-[#c4b5d0]">
              {formattedCommission}
            </span>
            <span className="pb-1 text-sm font-bold text-gray-500 dark:text-gray-400">د.ل</span>
            <span className="mb-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-[#6B5478] shadow-sm dark:bg-gray-900/80 dark:text-[#c4b5d0]">
              متوقعة
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            محسوبة من{" "}
            <strong className="text-gray-700 dark:text-gray-200">{summary.activeHallCount}</strong> صالة نشطة — حسب
            نسبة العمولة التي يحددها الأدمن لكل صالة
          </p>
        </div>

        <Link
          to={SUPER_ADMIN_ROUTES.commissions}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6B5478] py-2.5 text-xs font-bold text-white shadow-sm shadow-[#6B5478]/25 transition hover:bg-[#5a4668]"
        >
          عرض المالية والعمولات
          <ArrowLeft size={14} />
        </Link>
      </div>
    </section>
  );
}
