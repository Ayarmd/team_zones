import { formatCurrency } from "../utils/financeData";

function MiniLineChart({ points, stroke }) {
  if (!points?.length) return null;
  const max = Math.max(...points.map((p) => p.value), 1);
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? 50 : (i / (points.length - 1)) * 100;
    const y = 92 - (p.value / max) * 72;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="finance-pdf-chart__svg">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(" ")}
      />
    </svg>
  );
}

function ChartBlock({ title, points, stroke, show }) {
  if (!show) return null;
  return (
    <div className="finance-pdf-chart">
      <h3 className="finance-pdf-chart__title">{title}</h3>
      <MiniLineChart points={points} stroke={stroke} />
    </div>
  );
}

export default function FinanceReportPdfView({ data }) {
  if (!data) return null;

  const type = data.reportType;
  const showAll = type === "full";
  const showRevenue = showAll || type === "revenue";
  const showExpenses = showAll || type === "expenses";
  const showProfit = showAll || type === "net";

  return (
    <div className="finance-pdf-root" dir="rtl">
      <header className="finance-pdf-header">
        <div className="finance-pdf-brand">
          <img src="/zones-logo.png" alt="ZONES" className="finance-pdf-logo" onError={(e) => { e.target.style.display = "none"; }} />
          <span className="finance-pdf-brand__text">ZONES</span>
        </div>
        <div className="finance-pdf-header__meta">
          <p className="finance-pdf-header__lounge">{data.loungeName}</p>
          <p className="finance-pdf-header__date">تاريخ الإنشاء: {data.createdAt}</p>
          <p className="finance-pdf-header__period">الفترة: {data.periodLabel}</p>
          <p className="finance-pdf-header__type">نوع التقرير: {data.reportTypeLabel}</p>
        </div>
      </header>

      <section className="finance-pdf-section">
        <h2 className="finance-pdf-section__title">ملخص مالي</h2>
        <div className="finance-pdf-summary">
          <div className="finance-pdf-summary__item finance-pdf-summary__item--cyan">
            <span>إجمالي الإيرادات</span>
            <strong>{formatCurrency(data.summary.revenue)}</strong>
          </div>
          <div className="finance-pdf-summary__item finance-pdf-summary__item--rose">
            <span>إجمالي المصروفات</span>
            <strong>{formatCurrency(data.summary.expenses)}</strong>
          </div>
          <div className="finance-pdf-summary__item finance-pdf-summary__item--green">
            <span>صافي الأرباح</span>
            <strong>{formatCurrency(data.summary.net)}</strong>
          </div>
        </div>
      </section>

      <section className="finance-pdf-section">
        <h2 className="finance-pdf-section__title">الرسوم البيانية</h2>
        <div className="finance-pdf-charts">
          <ChartBlock title="أداء الأرباح" points={data.charts.profit} stroke="#22c55e" show={showProfit} />
          <ChartBlock title="أداء الإيرادات" points={data.charts.revenue} stroke="#22d3ee" show={showRevenue} />
          <ChartBlock title="أداء المصروفات" points={data.charts.expenses} stroke="#ef4444" show={showExpenses} />
        </div>
      </section>

      <section className="finance-pdf-section">
        <h2 className="finance-pdf-section__title">إحصائيات</h2>
        <ul className="finance-pdf-stats">
          <li>
            <span>أكثر جهاز استخداماً</span>
            <strong>{data.stats.topDevice}</strong>
          </li>
          <li>
            <span>أكثر باقة حجزاً</span>
            <strong>{data.stats.topPackage}</strong>
          </li>
          <li>
            <span>متوسط الحجوزات اليومية</span>
            <strong>{data.stats.dailyBookings}</strong>
          </li>
          <li>
            <span>أعلى يوم ربح</span>
            <strong>
              {data.stats.bestProfitDay} — {formatCurrency(data.stats.bestProfitValue)}
            </strong>
          </li>
        </ul>
      </section>

      <footer className="finance-pdf-footer">
        يتم احتساب البيانات تلقائياً من الحجوزات والأجهزة والباقات والمصروفات المسجلة داخل نظام ZONES.
      </footer>
    </div>
  );
}
