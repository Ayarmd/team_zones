import IconGlyph from "../../../../shared/components/ui/IconGlyph";

export default function KpiCard({ label, value, hint, icon: Icon, tone = "primary" }) {
  const accents = {
    primary: "text-[#6B5478]",
    green: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  const accent = accents[tone] || accents.primary;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      {Icon ? <IconGlyph icon={Icon} tone={tone} size={24} /> : null}
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`mt-0.5 text-2xl font-extrabold ${accent}`}>{value}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p> : null}
      </div>
    </div>
  );
}
