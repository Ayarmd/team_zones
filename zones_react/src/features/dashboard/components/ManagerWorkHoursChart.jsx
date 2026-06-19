import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../components/ui/chart";
import { WORK_HOURS_CAPTION } from "../data/workHoursData";

const chartConfig = {
  hours: {
    label: "ساعات العمل",
    color: "#6B5478",
  },
};

export default function ManagerWorkHoursChart({ data }) {
  const peak = data.reduce((max, row) => Math.max(max, row.hours || 0), 0);

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">ساعات العمل</h2>
          <p className="mt-1 text-[11px] text-gray-400">{WORK_HOURS_CAPTION}</p>
        </div>
        <span className="rounded-full bg-[#6B5478]/10 px-3 py-1 text-[11px] font-bold text-[#6B5478]">
          ذروة {peak} ساعة
        </span>
      </div>

      <ChartContainer config={chartConfig} className="h-72 w-full">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.25} />
          <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="#6B5478"
            fill="#6B5478"
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </section>
  );
}
