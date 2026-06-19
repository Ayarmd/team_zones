import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import DownloadReportModal from "../components/DownloadReportModal";
import {
  MONTHS_AR,
  formatCurrency,
  formatPct,
  mix,
  yearOptions,
} from "../utils/financeData";
import "./FinancialManagementPage.css";
import { useTheme } from "../../../shared/theme/useTheme";

function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}

function buildChartSeries(year, month, granularity) {
  const seed = year * 400 + month * 17 + (granularity === "daily" ? 3 : granularity === "weekly" ? 7 : 11);
  const out = [];

  if (granularity === "daily") {
    const n = daysInMonth(year, month);
    for (let d = 1; d <= n; d += 1) {
      const t = seed + d * 1.7;
      const wave = mix(t) * 0.55 + mix(t + 4) * 0.45;
      const revenue = 3200 + wave * 4200 + mix(t + 2) * 1800;
      const expenses = revenue * (0.28 + mix(t + 5) * 0.22);
      out.push({ label: String(d), revenue, expenses, netProfit: revenue - expenses });
    }
    return out;
  }

  if (granularity === "weekly") {
    for (let w = 1; w <= 4; w += 1) {
      const t = seed + w * 11;
      const revenue = 18000 + mix(t) * 22000 + mix(t + 3) * 8000;
      const expenses = revenue * (0.3 + mix(t + 1) * 0.2);
      out.push({
        label: `الأسبوع ${w}`,
        revenue,
        expenses,
        netProfit: revenue - expenses,
      });
    }
    return out;
  }

  for (let m = 0; m < 12; m += 1) {
    const t = seed + m * 19 + year;
    const revenue = 95000 + mix(t) * 72000 + mix(t + 6) * 40000;
    const expenses = revenue * (0.32 + mix(t + 2) * 0.18);
    out.push({
      label: MONTHS_AR[m].slice(0, 3),
      revenue,
      expenses,
      netProfit: revenue - expenses,
    });
  }
  return out;
}

function deriveTotals(year, month) {
  const seed = year * 400 + month * 23;
  const revenue = 128000 + mix(seed) * 92000 + mix(seed + 1) * 48000;
  const expenses = revenue * (0.31 + mix(seed + 3) * 0.21);
  const net = revenue - expenses;
  const prevRev = revenue / (1 + (mix(seed + 5) - 0.5) * 0.14);
  const prevExp = expenses / (1 + (mix(seed + 6) - 0.5) * 0.12);
  const prevNet = prevRev - prevExp;
  return {
    revenue,
    expenses,
    net,
    revDelta: ((revenue - prevRev) / prevRev) * 100,
    expDelta: ((expenses - prevExp) / prevExp) * 100,
    netDelta: ((net - prevNet) / Math.abs(prevNet || 1)) * 100,
  };
}

function deriveInsights(year, month, series, granularity) {
  const seed = year * 300 + month * 13 + (granularity === "monthly" ? 99 : 0);
  const devices = [
    { name: "PS5 — منطقة VIP", hours: 138 + mix(seed) * 42 },
    { name: "PC Gaming — الصف أ", hours: 124 + mix(seed + 1) * 38 },
    { name: "Xbox Series X — ركن أ", hours: 112 + mix(seed + 2) * 36 },
  ];
  const top = devices[Math.floor(mix(seed + 4) * devices.length)];
  let best = series[0];
  let worst = series[0];
  for (const p of series) {
    if (p.netProfit > best.netProfit) best = p;
    if (p.netProfit < worst.netProfit) worst = p;
  }
  const dailyAvg = 42 + mix(seed + 8) * 28;
  return {
    topDevice: top.name,
    topHours: Math.round(top.hours),
    bestLabel: best.label,
    bestProfit: best.netProfit,
    worstLabel: worst.label,
    worstProfit: worst.netProfit,
    dailyBookings: Math.round(dailyAvg * 10) / 10,
  };
}

function FinanceTooltip({ active, payload, label, isLight }) {
  if (!active || !payload?.length) return null;
  const map = {
    revenue: "الإيرادات",
    expenses: "المصروفات",
    netProfit: "صافي الربح",
  };
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
        border: "1px solid rgba(178, 63, 255, 0.35)",
        borderRadius: "12px",
        padding: "0.65rem 0.85rem",
        color: "#f2f7ff",
        fontSize: "0.78rem",
      };
  return (
    <div style={boxStyle}>
      <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{label}</div>
      {payload.map((p) => (
        <TooltipLine key={p.dataKey} p={p} map={map} mutedColor={isLight ? "#4b5563" : "#94a3b8"} />
      ))}
    </div>
  );
}

function TooltipLine({ p, map, mutedColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
      <span style={{ color: mutedColor }}>{map[p.dataKey] ?? p.dataKey}</span>
      <span style={{ fontWeight: 700 }}>{formatCurrency(p.value)}</span>
    </div>
  );
}

export default function FinancialManagementPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isChartLight = theme === "light";
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [granularity, setGranularity] = useState("daily");

  const chartSeries = useMemo(
    () => buildChartSeries(year, month, granularity),
    [year, month, granularity],
  );
  const totals = useMemo(() => deriveTotals(year, month), [year, month]);
  const insights = useMemo(
    () => deriveInsights(year, month, chartSeries, granularity),
    [year, month, chartSeries, granularity],
  );
  const yearsOptions = useMemo(() => yearOptions(), []);

  const chartPalette = useMemo(
    () =>
      isChartLight
        ? {
            grid: "#e5e7eb",
            tick: "#4b5563",
            axis: "#d1d5db",
            legend: "#111827",
          }
        : {
            grid: "rgba(107, 84, 120, 0.35)",
            tick: "#d1d5db",
            axis: "#6b5478",
            legend: "#f9fafb",
          },
    [isChartLight],
  );
  const revClass =
    totals.revDelta > 0.4 ? "finance-card__delta--up" : totals.revDelta < -0.4 ? "finance-card__delta--down" : "finance-card__delta--flat";
  const expClass =
    totals.expDelta > 0.4 ? "finance-card__delta--down" : totals.expDelta < -0.4 ? "finance-card__delta--up" : "finance-card__delta--flat";
  const netClass =
    totals.netDelta > 0.4 ? "finance-card__delta--up" : totals.netDelta < -0.4 ? "finance-card__delta--down" : "finance-card__delta--flat";

  return (
    <ManagerLayout title="الإدارة المالية">
      <div className="finance-page" dir="rtl">
        <div className="finance-kpi-grid">
          <button
            type="button"
            className="finance-card finance-card--blue finance-card--clickable"
            onClick={() => navigate("/finance/revenues")}
            aria-label="عرض تفاصيل إجمالي الإيرادات"
          >
            <div className="finance-card__top">
              <span className="finance-card__label">إجمالي الإيرادات</span>
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
            onClick={() => navigate("/finance/expenses")}
            aria-label="عرض تفاصيل المصروفات"
          >
            <div className="finance-card__top">
              <span className="finance-card__label">إجمالي المصروفات</span>
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
            onClick={() => navigate("/finance/net-profit")}
            aria-label="عرض تفاصيل صافي الأرباح"
          >
            <div className="finance-card__top">
              <span className="finance-card__label">صافي الأرباح</span>
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
            onClick={() => setReportModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setReportModalOpen(true);
              }
            }}
            aria-label="فتح نافذة تنزيل التقرير المالي"
          >
            <div className="finance-card__top">
              <span className="finance-card__label">تنزيل التقارير</span>
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
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
            </label>
            <label>
              السنة
              <select className="finance-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {yearsOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
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
                  wrapperStyle={{
                    fontSize: "12px",
                    paddingTop: "0.5rem",
                    color: chartPalette.legend,
                  }}
                  formatter={(value) =>
                    ({ revenue: "الإيرادات", expenses: "المصروفات", netProfit: "صافي الربح" }[value] ??
                      value)
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
                <div className="finance-mini__sub">{insights.topHours} ساعة</div>
              </div>
              <span className="finance-mini__icon" aria-hidden><Gamepad2 size={22} strokeWidth={2} /></span>
            </div>
          </article>
          <article className="finance-mini">
            <span className="finance-mini__label">أعلى يوم ربح</span>
            <div className="finance-mini__row">
              <div>
                <div className="finance-mini__value">{insights.bestLabel}</div>
                <div className="finance-mini__sub">{formatCurrency(insights.bestProfit)}</div>
              </div>
              <span className="finance-mini__icon" aria-hidden><TrendingUp size={22} strokeWidth={2} /></span>
            </div>
          </article>
          <article className="finance-mini">
            <span className="finance-mini__label">أقل يوم ربح</span>
            <div className="finance-mini__row">
              <div>
                <div className="finance-mini__value">{insights.worstLabel}</div>
                <div className="finance-mini__sub">{formatCurrency(insights.worstProfit)}</div>
              </div>
              <span className="finance-mini__icon" aria-hidden><TrendingDown size={22} strokeWidth={2} /></span>
            </div>
          </article>
          <article className="finance-mini">
            <span className="finance-mini__label">متوسط الحجوزات اليومية</span>
            <div className="finance-mini__row">
              <div>
                <div className="finance-mini__value">{insights.dailyBookings}</div>
                <div className="finance-mini__sub">حجز / يوم (معدّل متحرك)</div>
              </div>
              <span className="finance-mini__icon" aria-hidden><CalendarDays size={22} strokeWidth={2} /></span>
            </div>
          </article>
        </div>
      </div>
      <DownloadReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} />
    </ManagerLayout>
  );
}
