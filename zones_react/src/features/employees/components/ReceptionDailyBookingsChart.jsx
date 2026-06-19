import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../components/ui/chart";

const chartConfig = {
  app: {
    label: "تطبيق الزبون",
    color: "#6B5478",
  },
  manual: {
    label: "حجز الاستقبال",
    color: "#836a90",
  },
};

export default function ReceptionDailyBookingsChart({ data }) {
  const total = data.reduce((sum, row) => sum + (row.app || 0) + (row.manual || 0), 0);

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">الحجوزات اليومية</h2>
          <p className="mt-1 text-[11px] text-gray-400">آخر 7 أيام — من التطبيق وحجوزات الاستقبال</p>
        </div>
        <span className="rounded-full bg-[#6B5478]/10 px-3 py-1 text-[11px] font-bold text-[#6B5478]">
          {total} حجز
        </span>
      </div>

      <ChartContainer config={chartConfig} className="h-72 w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.25} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="app" stackId="bookings" fill="#6B5478" radius={[0, 0, 0, 0]} />
          <Bar dataKey="manual" stackId="bookings" fill="#836a90" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </section>
  );
}
