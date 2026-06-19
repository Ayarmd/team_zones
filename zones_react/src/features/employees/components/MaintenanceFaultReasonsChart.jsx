import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "../../../components/ui/chart";

function FaultReasonTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-1 font-extrabold text-gray-900 dark:text-white">{item.name}</p>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
        <span className="font-bold text-gray-600 dark:text-gray-300">
          {item.value} {item.value === 1 ? "مرة" : "مرات"}
        </span>
      </div>
    </div>
  );
}

export default function MaintenanceFaultReasonsChart({ data }) {
  const total = data.reduce((sum, row) => sum + row.value, 0);
  const chartHeight = Math.max(220, data.length * 52 + 16);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">أسباب الأعطال</h2>
          <p className="mt-1 text-[11px] text-gray-400">صف لكل سبب — الأعلى أحمر والأقل موف</p>
        </div>
        <span className="rounded-full bg-[#6B5478]/10 px-3 py-1 text-[11px] font-bold text-[#6B5478]">
          {total} {total === 1 ? "عطل" : "أعطال"}
        </span>
      </div>

      <div className="px-2 pb-4 pt-4 sm:px-4">
        <ChartContainer config={{ value: { label: "التكرار", color: "#6B5478" } }} className="w-full" style={{ height: chartHeight }}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            barCategoryGap="18%"
          >
            <defs>
              {data.map((entry, index) => (
                <linearGradient key={entry.name} id={`fault-bar-${index}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={entry.color} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>

            <XAxis type="number" reversed hide />
            <YAxis
              type="category"
              dataKey="name"
              orientation="right"
              width={132}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fontWeight: 700, fill: "currentColor" }}
              className="text-gray-700 dark:text-gray-200"
            />
            <ChartTooltip cursor={{ fill: "rgba(107, 84, 120, 0.06)" }} content={<FaultReasonTooltip />} />
            <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={26} animationDuration={900}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={`url(#fault-bar-${index})`} stroke={entry.color} strokeWidth={0} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </section>
  );
}
