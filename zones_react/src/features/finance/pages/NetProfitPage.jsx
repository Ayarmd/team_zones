import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import DownloadReportModal from "../components/DownloadReportModal";
import FinanceAnalysisHub from "../components/FinanceAnalysisHub";
import FinanceExpensesAnalyticsPanel from "../components/FinanceExpensesAnalyticsPanel";
import FinanceProfitsPanel from "../components/FinanceProfitsPanel";
import FinanceRevenuesPanel from "../components/FinanceRevenuesPanel";

const VIEW_TITLES = {
  revenues: "عرض الإيرادات",
  expenses: "عرض المصروفات",
  profits: "عرض الأرباح",
};

const VALID_VIEWS = new Set(["revenues", "expenses", "profits"]);

function AnalysisPageHeader({ title, description, onBack }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3" dir="rtl">
      <div className="min-w-0">
        <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">{title}</h1>
        {description ? (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        ) : null}
      </div>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="رجوع للتحليل"
          title="رجوع للتحليل"
          className="shrink-0 p-0 text-[#6B5478] transition hover:text-[#5a4668] dark:hover:text-[#c4b5d0]"
        >
          <ArrowRight size={20} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}

export default function NetProfitPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramView = searchParams.get("view");
  const [view, setView] = useState(VALID_VIEWS.has(paramView) ? paramView : null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (VALID_VIEWS.has(paramView)) {
      setView(paramView);
    } else if (!paramView) {
      setView(null);
    }
  }, [paramView]);

  const openView = (next) => {
    setView(next);
    if (next) {
      setSearchParams({ view: next }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const title = view ? VIEW_TITLES[view] : "التحليل";
  const description = view
    ? "عرض تفصيلي ضمن واجهة التحليل المالي."
    : "نظرة شاملة على الأداء المالي مع إمكانية الانتقال لكل نوع عرض.";

  return (
    <ManagerLayout>
      <AnalysisPageHeader
        title={title}
        description={description}
        onBack={view ? () => openView(null) : undefined}
      />

      {!view ? (
        <FinanceAnalysisHub onSelectView={openView} onOpenReports={() => setReportOpen(true)} />
      ) : null}
      {view === "revenues" ? <FinanceRevenuesPanel /> : null}
      {view === "expenses" ? <FinanceExpensesAnalyticsPanel /> : null}
      {view === "profits" ? <FinanceProfitsPanel /> : null}

      <DownloadReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </ManagerLayout>
  );
}
