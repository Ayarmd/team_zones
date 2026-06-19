import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Coins,
  Download,
  Gamepad2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../../shared/theme/useTheme";
import { MONTHS_AR, formatCurrency, formatPct, yearOptions } from "../utils/financeData";
import {
  buildOverviewChartSeries,
  deriveOverviewInsights,
  deriveOverviewTotals,
  overviewChartPalette,
  overviewTooltipBox,
} from "../utils/financeOverviewHelpers";
import { BOOKING_REVENUE_EVENT } from "../../employees/data/bookingRevenueStorage";
import { RECEPTION_CALENDAR_EVENT } from "../../employees/data/receptionCalendarStorage";
import { EXPENSES_STORAGE_EVENT } from "../data/expensesStorage";
import "../pages/FinancialManagementPage.css";

function FinanceTooltip({ active, payload, label, isLight }) {
  if (!active || !payload?.length) return null;
  const map = {
    revenue: "الإيرادات",
    expenses: "المصروفات",
    netProfit: "صافي الربح",
  };
  return (
    <div style={overviewTooltipBox(isLight)}>
      <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{label}</div>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}
        >
          <span style={{ color: isLight ? "#4b5563" : "#94a3b8" }}>{map[p.dataKey] ?? p.dataKey}</span>
          <span style={{ fontWeight: 700 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function FinanceAnalysisHub({ onSelectView, onOpenReports }) {
  const { theme } = useTheme();
  const isChartLight = theme === "light";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [granularity, setGranularity] = useState("daily");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const sync = () => setRefreshKey((k) => k + 1);
    window.addEventListener(EXPENSES_STORAGE_EVENT, sync);
    window.addEventListener(BOOKING_REVENUE_EVENT, sync);
    window.addEventListener(RECEPTION_CALENDAR_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(EXPENSES_STORAGE_EVENT, sync);
      window.removeEventListener(BOOKING_REVENUE_EVENT, sync);
      window.removeEventListener(RECEPTION_CALENDAR_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const chartSeries = useMemo(
    () => buildOverviewChartSeries(year, month, granularity),
    [year, month, granularity, refreshKey],
  );
  const totals = useMemo(() => deriveOverviewTotals(year, month), [year, month, refreshKey]);
  const insights = useMemo(
    () => deriveOverviewInsights(year, month, chartSeries),
    [year, month, chartSeries, refreshKey],
  );
  const yearsOptions = useMemo(() => yearOptions(), []);
  const chartPalette = useMemo(() => overviewChartPalette(isChartLight), [isChartLight]);

  const revClass =
    totals.revDelta > 0.4 ? "finance-card__delta--up" : totals.revDelta < -0.4 ? "finance-card__delta--down" : "finance-card__delta--flat";
  const expClass =
    totals.expDelta > 0.4 ? "finance-card__delta--down" : totals.expDelta < -0.4 ? "finance-card__delta--up" : "finance-card__delta--flat";
  const netClass =
    totals.netDelta > 0.4 ? "finance-card__delta--up" : totals.netDelta < -0.4 ? "finance-card__delta--down" : "finance-card__delta--flat";

  return (
    <div className="finance-page" dir="rtl">
      <div className="finance-kpi-grid">
        <button
          type="button"
          className="finance-card finance-card--blue finance-card--clickable"
          onClick={() => onSelectView("revenues")}
          aria-label="عرض الإيرادات"
        >
          <div className="finance-card__top">
            <span className="finance-card__label">عرض الإيرادات</span>
            <span className="finance-card__icon finance-card__icon--blue" aria-hidden>
              <TrendingUp size={22} strokeWidth={2.25} />
            </span>
          </div>
          <div className="finance-card__value">{formatCurrency(totals.revenue)}</div>
          <div className={`finance-card__delta ${revClass}`}>{formatPct(totals.revDelta)}</div>
        </button>

        <button
          type="button"
          className="finance-card finance-card--red finance-card--clickable finance-card--clickable-red"
          onClick={() => onSelectView("expenses")}
          aria-label="عرض المصروفات"
        >
          <div className="finance-card__top">
            <span className="finance-card__label">عرض المصروفات</span>
            <span className="finance-card__icon finance-card__icon--red" aria-hidden>
              <Wallet size={22} strokeWidth={2.1} />
            </span>
          </div>
          <div className="finance-card__value">{formatCurrency(totals.expenses)}</div>
          <div className={`finance-card__delta ${expClass}`}>{formatPct(totals.expDelta)}</div>
        </button>

        <button
          type="button"
          className="finance-card finance-card--green finance-card--clickable finance-card--clickable-green"
          onClick={() => onSelectView("profits")}
          aria-label="عرض الأرباح"
        >
          <div className="finance-card__top">
            <span className="finance-card__label">عرض الأرباح</span>
            <span className="finance-card__icon finance-card__icon--green" aria-hidden>
              <Coins size={22} strokeWidth={2.1} />
            </span>
          </div>
          <div className="finance-card__value">{formatCurrency(totals.net)}</div>
          <div className={`finance-card__delta ${netClass}`}>{formatPct(totals.netDelta)}</div>
        </button>

        <article
          className="finance-card finance-card--purple finance-card--clickable finance-card--clickable-purple"
          role="button"
          tabIndex={0}
          onClick={onOpenReports}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenReports();
            }
          }}
          aria-label="تنزيل التقارير المالية"
        >
          <div className="finance-card__top">
            <span className="finance-card__label">تنزيل التقارير المالية</span>
            <span className="finance-card__icon finance-card__icon--purple" aria-hidden>
              <Download size={22} strokeWidth={2.1} />
            </span>
          </div>
          <p className="finance-card__hint">تقرير مالي شامل للفترة المحددة، يُحدَّث تلقائيًا من نشاط الصالة.</p>
          <span className="finance-download-btn">
            <Download size={16} strokeWidth={2.25} aria-hidden />
            تنزيل التقرير
          </span>
        </article>
      </div>

      <section className="finance-section">
        <h2 className="finance-section__title">الأداء المالي لهذا الشهر</h2>
        <div className="finance-filters">
          <label>
            الشهر
            <select className="finance-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS_AR.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            السنة
            <select className="finance-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {yearsOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label>
            طريقة العرض
            <select className="finance-select" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
          </label>
        </div>
        <div className="finance-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartSeries} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={chartPalette.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: chartPalette.tick, fontSize: 12 }}
                axisLine={{ stroke: chartPalette.axis }}
                tickLine={{ stroke: chartPalette.axis }}
              />
              <YAxis
                orientation="right"
                tick={{ fill: chartPalette.tick, fontSize: 12 }}
                axisLine={{ stroke: chartPalette.axis }}
                tickLine={{ stroke: chartPalette.axis }}
                tickFormatter={(v) =>
                  Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))
                }
              />
              <Tooltip content={(props) => <FinanceTooltip {...props} isLight={isChartLight} />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "0.5rem", color: chartPalette.legend }}
                formatter={(value) =>
                  ({ revenue: "الإيرادات", expenses: "المصروفات", netProfit: "صافي الربح" }[value] ?? value)
                }
              />
              <Line type="monotone" dataKey="revenue" name="revenue" stroke="#3d9e6f" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#3d9e6f" }} />
              <Line type="monotone" dataKey="expenses" name="expenses" stroke="#d95555" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#d95555" }} />
              <Line type="monotone" dataKey="netProfit" name="netProfit" stroke="#6B5478" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#6B5478" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="finance-mini-grid">
        <article className="finance-mini">
          <span className="finance-mini__label">أكثر جهاز استخدامًا</span>
          <div className="finance-mini__row">
            <div>
              <div className="finance-mini__value">{insights.topDevice}</div>
              <div className="finance-mini__sub">{formatCurrency(insights.topDeviceProfit)}</div>
            </div>
            <span className="finance-mini__icon" aria-hidden>
              <Gamepad2 size={22} strokeWidth={2} />
            </span>
          </div>
        </article>
        <article className="finance-mini">
          <span className="finance-mini__label">أعلى يوم ربح</span>
          <div className="finance-mini__row">
            <div>
              <div className="finance-mini__value">{insights.bestLabel}</div>
              <div className="finance-mini__sub">{formatCurrency(insights.bestProfit)}</div>
            </div>
            <span className="finance-mini__icon" aria-hidden>
              <TrendingUp size={22} strokeWidth={2} />
            </span>
          </div>
        </article>
        <article className="finance-mini">
          <span className="finance-mini__label">أقل يوم ربح</span>
          <div className="finance-mini__row">
            <div>
              <div className="finance-mini__value">{insights.worstLabel}</div>
              <div className="finance-mini__sub">{formatCurrency(insights.worstProfit)}</div>
            </div>
            <span className="finance-mini__icon" aria-hidden>
              <TrendingDown size={22} strokeWidth={2} />
            </span>
          </div>
        </article>
        <article className="finance-mini">
          <span className="finance-mini__label">متوسط الحجوزات اليومية</span>
          <div className="finance-mini__row">
            <div>
              <div className="finance-mini__value">{insights.dailyBookings}</div>
              <div className="finance-mini__sub">حجز / يوم (معدّل متحرك)</div>
            </div>
            <span className="finance-mini__icon" aria-hidden>
              <CalendarDays size={22} strokeWidth={2} />
            </span>
          </div>
        </article>
      </div>
    </div>
  );
}
