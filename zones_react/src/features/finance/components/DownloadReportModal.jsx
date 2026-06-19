import { useCallback, useRef, useState } from "react";
import AdminModal from "../../devices-packages/components/AdminModal";
import Button from "../../super-admin/components/ui/Button";
import { buildReportPayload, resolveReportPeriod } from "../utils/financeData";
import { generateFinanceReportPdf } from "../utils/generateFinanceReportPdf";
import FinanceReportPdfView from "./FinanceReportPdfView";
import "./DownloadReportModal.css";

const REPORT_TYPES = [
  { id: "full", label: "تقرير شامل" },
  { id: "revenue", label: "الإيرادات" },
  { id: "expenses", label: "المصروفات" },
  { id: "net", label: "صافي الأرباح" },
];

const PERIODS = [
  { id: "week", label: "هذا الأسبوع" },
  { id: "month", label: "هذا الشهر" },
  { id: "year", label: "هذه السنة" },
  { id: "custom", label: "فترة مخصصة" },
];

const labelCls = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function RadioOption({ name, value, checked, onChange, label }) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-end gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
        checked
          ? "border-[#6B5478]/40 bg-[#6B5478]/8 text-[#6B5478] dark:border-[#6B5478]/50 dark:bg-[#6B5478]/15 dark:text-[#c4b5d0]"
          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#6B5478]/25 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-200"
      }`}
    >
      <span>{label}</span>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="accent-[#6B5478]"
      />
    </label>
  );
}

export default function DownloadReportModal({ open, onClose }) {
  const pdfRef = useRef(null);
  const [reportType, setReportType] = useState("full");
  const [period, setPeriod] = useState("month");
  const [dateFrom, setDateFrom] = useState(monthStartIso());
  const [dateTo, setDateTo] = useState(todayIso());
  const [pdfData, setPdfData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = useCallback(async () => {
    setError("");
    if (period === "custom") {
      if (!dateFrom || !dateTo) {
        setError("يرجى تحديد تاريخ البداية والنهاية.");
        return;
      }
      if (new Date(dateFrom) > new Date(dateTo)) {
        setError("تاريخ البداية يجب أن يكون قبل تاريخ النهاية.");
        return;
      }
    }

    setGenerating(true);
    try {
      const { from, to } = resolveReportPeriod(period, dateFrom, dateTo);
      const payload = buildReportPayload(reportType, from, to);
      setPdfData(payload);

      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      if (!pdfRef.current) {
        throw new Error("تعذر تجهيز التقرير.");
      }

      const safeType = REPORT_TYPES.find((t) => t.id === reportType)?.label ?? "تقرير";
      const fileName = `ZONES-${safeType}-${new Date().toISOString().slice(0, 10)}.pdf`;
      await generateFinanceReportPdf(pdfRef.current, fileName);
      setPdfData(null);
      onClose();
    } catch {
      setError("تعذر إنشاء ملف PDF. حاول مرة أخرى.");
      setPdfData(null);
    } finally {
      setGenerating(false);
    }
  }, [period, dateFrom, dateTo, reportType, onClose]);

  return (
    <>
      <AdminModal open={open} onClose={onClose} title="تنزيل التقرير المالي">
        <div className="mt-4 space-y-4" dir="rtl">
          <div>
            <span className={labelCls}>نوع التقرير</span>
            <div className="flex flex-col gap-2">
              {REPORT_TYPES.map((item) => (
                <RadioOption
                  key={item.id}
                  name="reportType"
                  value={item.id}
                  label={item.label}
                  checked={reportType === item.id}
                  onChange={() => setReportType(item.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <span className={labelCls}>الفترة الزمنية</span>
            <div className="flex flex-col gap-2">
              {PERIODS.map((item) => (
                <RadioOption
                  key={item.id}
                  name="period"
                  value={item.id}
                  label={item.label}
                  checked={period === item.id}
                  onChange={() => setPeriod(item.id)}
                />
              ))}
            </div>
            {period === "custom" ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label>
                  <span className={labelCls}>من تاريخ</span>
                  <input type="date" className={inputCls} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </label>
                <label>
                  <span className={labelCls}>إلى تاريخ</span>
                  <input type="date" className={inputCls} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </label>
              </div>
            ) : null}
          </div>

          {error ? <p className="text-end text-[11px] font-bold text-red-600">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={generating}>
              إلغاء
            </Button>
            <Button type="button" size="sm" onClick={handleDownload} disabled={generating}>
              {generating ? "جاري التجهيز..." : "تنزيل التقرير"}
            </Button>
          </div>
        </div>
      </AdminModal>

      {pdfData ? (
        <div className="finance-pdf-capture" ref={pdfRef} aria-hidden>
          <FinanceReportPdfView data={pdfData} />
        </div>
      ) : null}
    </>
  );
}
