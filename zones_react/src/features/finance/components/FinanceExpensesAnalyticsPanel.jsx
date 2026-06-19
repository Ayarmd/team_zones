import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../../shared/theme/useTheme";
import {
  MONTHS_AR,
  buildExpenseCategoryBreakdown,
  buildExpenseSeries,
  deriveExpenseInsights,
  deriveExpenseTotals,
  formatCurrency,
  formatPct,
  yearOptions,
} from "../utils/financeData";
import "../pages/ExpensesPage.css";

function ChartTooltip({ active, payload, label, isLight }) {
  if (!active || !payload?.length) return null;
  const name = label ?? payload[0]?.name;
  const value = payload[0]?.value;
  const boxStyle = isLight
    ? {
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "0.65rem 0.85rem",
        color: "#111827",
        fontSize: "0.78rem",
        boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
      }
    : {
        background: "#090f2f",
        border: "1px solid rgba(251, 113, 133, 0.45)",
        borderRadius: "12px",
        padding: "0.65rem 0.85rem",
        color: "#f2f7ff",
        fontSize: "0.78rem",
      };
  return (
    <div style={boxStyle}>
      <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{name}</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <span style={{ color: isLight ? "#4b5563" : "#94a3b8" }}>المبلغ</span>
        <span style={{ fontWeight: 700 }}>{formatCurrency(value ?? 0)}</span>
      </div>
    </div>
  );
}

export default function FinanceExpensesAnalyticsPanel() {
  const { theme } = useTheme();
  const isChartLight = theme === "light";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const granularity = "daily";

  const series = useMemo(() => buildExpenseSeries(year, month, granularity), [year, month]);
  const totals = useMemo(() => deriveExpenseTotals(year, month), [year, month]);
  const insights = useMemo(() => deriveExpenseInsights(series, granularity), [series]);
  const categories = useMemo(() => buildExpenseCategoryBreakdown(year, month), [year, month]);
  const years = yearOptions();

  const expClass =
    totals.expDelta > 0.4 ? "finance-card__delta--down" : totals.expDelta < -0.4 ? "finance-card__delta--up" : "finance-card__delta--flat";

  const chartPalette = useMemo(
    () =>
      isChartLight
        ? { grid: "#e5e7eb", tick: "#4b5563", axis: "#d1d5db" }
        : { grid: "#242a50", tick: "#8ca4cc", axis: "#334155" },
    [isChartLight],
  );

  return (
    <div className="expenses-page" dir="rtl">
      <div className="finance-filters">
        <label>
          الشهر
          <select className="finance-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS_AR.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          السنة
          <select className="finance-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label>
          عرض حسب
          <select className="finance-select" value="daily" disabled aria-readonly>
            <option value="daily">يومي</option>
          </select>
        </label>
      </div>

      <div className="expenses-kpi-grid">
        <article className="finance-card finance-card--red">
          <div className="finance-card__top">
            <span className="finance-card__label">إجمالي المصروفات</span>
            <span className="finance-card__icon finance-card__icon--red" aria-hidden>
              <Wallet size={22} strokeWidth={2.1} />
            </span>
          </div>
          <div className="finance-card__value">{formatCurrency(totals.total)}</div>
          <div className={`finance-card__delta ${expClass}`}>{formatPct(totals.expDelta)}</div>
        </article>
        <article className="finance-card finance-card--red">
          <div className="finance-card__top">
            <span className="finance-card__label">متوسط المصروف اليومي</span>
          </div>
          <div className="finance-card__value">{formatCurrency(insights.dailyAvg)}</div>
          <div className="finance-card__delta finance-card__delta--flat">حسب الفترة المختارة</div>
        </article>
        <article className="finance-card finance-card--red">
          <div className="finance-card__top">
            <span className="finance-card__label">أعلى يوم مصروف</span>
            <span className="finance-card__icon finance-card__icon--red" aria-hidden>
              <TrendingUp size={22} strokeWidth={2.1} />
            </span>
          </div>
          <div className="finance-card__value">{insights.highestLabel}</div>
          <div className="finance-card__delta finance-card__delta--down">{formatCurrency(insights.highestValue)}</div>
        </article>
        <article className="finance-card finance-card--red">
          <div className="finance-card__top">
            <span className="finance-card__label">أقل يوم مصروف</span>
            <span className="finance-card__icon finance-card__icon--red" aria-hidden>
              <TrendingDown size={22} strokeWidth={2.1} />
            </span>
          </div>
          <div className="finance-card__value">{insights.lowestLabel}</div>
          <div className="finance-card__delta finance-card__delta--up">{formatCurrency(insights.lowestValue)}</div>
        </article>
      </div>

      <div className="expenses-charts">
        <section className="expenses-chart-panel">
          <h2 className="expenses-chart-panel__title">المصروفات اليومية</h2>
          <div className="expenses-line-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: chartPalette.tick, fontSize: 11 }} axisLine={{ stroke: chartPalette.axis }} />
                <YAxis
                  orientation="right"
                  tick={{ fill: chartPalette.tick, fontSize: 11 }}
                  axisLine={{ stroke: chartPalette.axis }}
                  tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)))}
                />
                <Tooltip content={<ChartTooltip isLight={isChartLight} />} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.6} dot={false} activeDot={{ r: 4, fill: "#ef4444" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="expenses-chart-panel">
          <h2 className="expenses-chart-panel__title">توزيع المصروفات حسب الفئة</h2>
          <div className="expenses-donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="52%"
                  outerRadius="78%"
                  paddingAngle={2}
                  stroke={isChartLight ? "#e5e7eb" : "rgba(6, 13, 41, 0.9)"}
                  strokeWidth={2}
                >
                  {categories.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip isLight={isChartLight} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="expenses-donut-legend">
            {categories.map((c) => (
              <span key={c.key} className="expenses-donut-legend__item">
                <span className="expenses-donut-legend__dot" style={{ background: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
