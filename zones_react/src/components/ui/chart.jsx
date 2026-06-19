import { createContext, useContext, useId, useMemo } from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "../../lib/utils";

const ChartContext = createContext(null);

function useChart() {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within ChartContainer");
  return ctx;
}

export function ChartContainer({ id, className, children, config, ...props }) {
  const uid = useId();
  const chartId = `chart-${id || uid.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex w-full justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-gray-500",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-gray-200/60",
          "dark:[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-gray-700/60",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-gray-300/50",
          className,
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export function ChartTooltip(props) {
  return <RechartsPrimitive.Tooltip {...props} />;
}

export function ChartLegend(props) {
  return <RechartsPrimitive.Legend {...props} />;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  indicator = "dot",
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {!hideLabel && label ? (
        <p className="mb-1.5 font-bold text-gray-900 dark:text-white">{label}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((item) => {
          const key = item.dataKey || item.name;
          const meta = config?.[key] || {};
          const color = meta.color || item.color;
          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                {indicator === "dot" ? (
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ) : null}
                {meta.label || item.name}
              </span>
              <span className="font-bold tabular-nums text-gray-900 dark:text-white">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartLegendContent({ payload }) {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-[11px] font-semibold">
      {payload.map((entry) => {
        const key = entry.dataKey;
        const meta = config?.[key] || {};
        return (
          <span key={key} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: meta.color || entry.color }}
            />
            {meta.label || entry.value}
          </span>
        );
      })}
    </div>
  );
}

export function useChartConfig(config) {
  return useMemo(() => config, [config]);
}
