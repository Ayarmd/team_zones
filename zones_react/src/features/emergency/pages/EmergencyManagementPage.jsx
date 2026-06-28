import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  Bell,
  CalendarClock,
  ChevronDown,
  FileText,
  Flame,
  Loader,
  Plus,
  Power,
  Radio,
  ShieldAlert,
  Trash2,
  Zap,
} from "lucide-react";
import {
  zonesConfirm,
  zonesToastInfo,
  zonesToastSuccess,
  zonesToastWarning,
} from "../../../shared/utils/zonesAlerts";
import ManagerHeaderUser from "../../../shared/components/ManagerHeaderUser";
import IconButton from "../../../shared/components/ui/IconButton";
import IconGlyph from "../../../shared/components/ui/IconGlyph";
import {
  TableSelectionModeBar,
  TableSelectHeaderCell,
  TableSelectRowCell,
  selectableRowClass,
} from "../../../shared/components/ui/TableSelection";
import {
  filterItemsByIds,
  resolveBulkActionIds,
  tableSelectColSpan,
} from "../../../shared/hooks/useTableSelection";
import { useTableSelectionMode } from "../../../shared/hooks/useTableSelectionMode";
import {
  BOOKINGS_STOP_EVENT,
  getActiveBookingsStopRecord,
  isBookingsStopped,
  refreshBookingStopsFromApi,
  resumeBookingsStop,
  startBookingsStop,
} from "../../alerts/data/bookingsStopStorage";
import {
  archiveEmergencyLog,
  fetchEmergencyLogs,
  registerEmergencyIncident,
  sendEmergencyNotification,
} from "../data/emergencyAlertsApi";
import StopBookingsFormModal from "../../alerts/components/StopBookingsFormModal";
import "./EmergencyManagementPage.css";

const BASE_TYPES = [
  { value: "fire", label: "حريق", icon: Flame },
  { value: "power", label: "انقطاع كهرباء", icon: Zap },
  { value: "technical", label: "خلل تقني", icon: Loader },
  { value: "other", label: "أخرى", icon: Radio },
];

function decodeCustomValue(value) {
  if (!value.startsWith("custom::")) return null;
  try {
    return decodeURIComponent(value.slice("custom::".length));
  } catch {
    return null;
  }
}

function rowIcon(typeValue) {
  const c = decodeCustomValue(typeValue);
  if (c) return AlertCircle;
  const b = BASE_TYPES.find((t) => t.value === typeValue);
  return b?.icon ?? AlertCircle;
}

function rowLabel(typeValue) {
  const c = decodeCustomValue(typeValue);
  if (c) return c;
  const base = BASE_TYPES.find((t) => t.value === typeValue || t.label === typeValue);
  if (base) return base.label;
  return typeValue || "—";
}

function encodeCustomValue(label) {
  return `custom::${encodeURIComponent(label)}`;
}

const PAGE_SIZE = 4;
const TABLE_DATA_COLS = 5;

export default function EmergencyManagementPage() {
  const [bookingsStopped, setBookingsStopped] = useState(() => isBookingsStopped());
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [customLabels, setCustomLabels] = useState([]);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    type: "fire",
    description: "",
    occurredAt: "",
    otherLabel: "",
  });

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState("employees");
  const [notifyText, setNotifyText] = useState("");
  const [logPage, setLogPage] = useState(1);

  const syncEmergencyLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError("");
    const result = await fetchEmergencyLogs();
    if (!result.ok) {
      setLogs([]);
      setArchivedCount(0);
      setLogsError(result.error || "تعذر تحميل سجل الطوارئ من الخادم.");
      setLogsLoading(false);
      return;
    }
    setLogs(result.logs);
    setArchivedCount(result.archivedCount);
    const labels = result.logs
      .map((row) => decodeCustomValue(row.typeValue))
      .filter(Boolean);
    if (labels.length) {
      setCustomLabels((prev) => [...new Set([...prev, ...labels])]);
    }
    setLogsLoading(false);
  }, []);

  useEffect(() => {
    syncEmergencyLogs();
  }, [syncEmergencyLogs]);

  useEffect(() => {
    const sync = async () => {
      await refreshBookingStopsFromApi();
      setBookingsStopped(isBookingsStopped());
    };
    sync();
    window.addEventListener(BOOKINGS_STOP_EVENT, sync);
    return () => window.removeEventListener(BOOKINGS_STOP_EVENT, sync);
  }, []);

  const handleBookingsToggle = async () => {
    if (bookingsStopped) {
      const active = getActiveBookingsStopRecord();
      const result = await resumeBookingsStop(active?.id);
      if (!result.ok) {
        zonesToastInfo(result.error);
        return;
      }
      setBookingsStopped(false);
      zonesToastSuccess("تم استئناف الحجوزات");
      return;
    }
    setStopModalOpen(true);
  };

  const handleStopSubmit = async ({ reasonKey, startsOn, endsOn }) => {
    const result = await startBookingsStop({ reasonKey, startsOn, endsOn });
    if (!result.ok) {
      zonesToastInfo(result.error);
      return;
    }
    setStopModalOpen(false);
    setBookingsStopped(true);
    zonesToastSuccess("تم إيقاف الحجوزات");
  };

  useEffect(() => {
    setLogPage(1);
  }, [logSearch]);

  const selectOptions = useMemo(() => {
    const customs = customLabels.map((label) => ({ value: encodeCustomValue(label), label, icon: null }));
    const base = BASE_TYPES.filter((t) => t.value !== "other");
    const other = BASE_TYPES.find((t) => t.value === "other");
    return other ? [...base, ...customs, other] : [...base, ...customs];
  }, [customLabels]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (r) =>
        r.description.toLowerCase().includes(q) || rowLabel(r.typeValue).toLowerCase().includes(q),
    );
  }, [logs, logSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));

  useEffect(() => {
    setLogPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pagedLogs = useMemo(() => {
    const start = (logPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, logPage]);

  const pageIds = useMemo(() => pagedLogs.map((row) => row.id), [pagedLogs]);
  const allIds = useMemo(() => filteredLogs.map((row) => row.id), [filteredLogs]);
  const selection = useTableSelectionMode({ items: filteredLogs, pageIds, allIds });

  const headerExtras = <ManagerHeaderUser />;

  const titleAside = <IconGlyph icon={ShieldAlert} tone="rose" size={20} />;

  const openRegister = useCallback(() => {
    setRegForm({ type: "fire", description: "", occurredAt: "", otherLabel: "" });
    setRegisterOpen(true);
  }, []);

  const submitRegister = async () => {
    if (!regForm.description.trim() || !regForm.occurredAt.trim()) {
      zonesToastWarning("يرجى تعبئة الوصف وتاريخ وقت الحدوث.");
      return;
    }
    let typeLabel = BASE_TYPES.find((t) => t.value === regForm.type)?.label || regForm.type;
    if (regForm.type === "other") {
      const t = regForm.otherLabel.trim();
      if (!t) {
        zonesToastWarning("يرجى كتابة نوع الطوارئ عند اختيار «أخرى».");
        return;
      }
      typeLabel = t;
      setCustomLabels((prev) => (prev.includes(t) ? prev : [...prev, t]));
    }

    const result = await registerEmergencyIncident({
      typeLabel,
      description: regForm.description.trim(),
      occurredAt: regForm.occurredAt.replace("T", " ").slice(0, 16),
    });

    if (!result.ok) {
      zonesToastInfo(result.error || "تعذر تسجيل الحالة على الخادم.");
      return;
    }

    setRegisterOpen(false);
    setLogPage(1);
    await syncEmergencyLogs();
    zonesToastSuccess(result.message || "تم تسجيل الحالة");
  };

  const deleteRow = async (row) => {
    const targetIds = resolveBulkActionIds(row.id, selection.selectedIds);
    const targets = filterItemsByIds(logs, targetIds);
    const isBulk = targets.length > 1;

    const confirmed = await zonesConfirm({
      title: isBulk ? `هل تريد حذف ${targets.length} حالات؟` : "هل تريد حذف هذه الحالة؟",
      html: '<p dir="rtl" style="margin:0;font-size:13px;line-height:1.6">سيتم نقل السجل إلى <b>الأرشيف</b>.</p>',
      icon: "warning",
      confirmText: "نعم، احذف",
      cancelText: "تراجع",
      danger: true,
    });
    if (!confirmed) return;

    for (const target of targets) {
      const result = await archiveEmergencyLog(target.id);
      if (!result.ok) {
        zonesToastInfo(result.error || "تعذر أرشفة السجل على الخادم.");
        return;
      }
    }

    selection.exitSelectionMode();
    await syncEmergencyLogs();
    zonesToastSuccess(isBulk ? `تم نقل ${targets.length} سجلات إلى الأرشيف` : "تم النقل إلى الأرشيف");
  };

  const handleBulkDelete = () => {
    const targets = filterItemsByIds(logs, selection.selectedIds);
    if (!targets.length) return;
    deleteRow(targets[0]);
  };

  const submitNotify = async () => {
    if (!notifyText.trim()) {
      zonesToastWarning("أدخل نص الإشعار");
      return;
    }

    const result = await sendEmergencyNotification({
      text: notifyText.trim(),
      target: notifyTarget,
    });

    if (!result.ok) {
      zonesToastInfo(result.error || "تعذر إرسال الإشعار عبر الخادم.");
      return;
    }

    const targetLabel =
      notifyTarget === "employees" ? "الموظفين" : notifyTarget === "customers" ? "الزبائن" : "الموظفين والزبائن";
    zonesToastSuccess(`تم إرسال الإشعار إلى: ${targetLabel}`, result.message || "تم الإرسال");
    setNotifyOpen(false);
    setNotifyText("");
    await syncEmergencyLogs();
  };

  const notifyPills = [
    { id: "employees", label: "الموظفين" },
    { id: "customers", label: "الزبائن" },
    { id: "both", label: "الموظفين والزبائن" },
  ];

  return (
    <>
    <div className="em-page flex flex-col gap-4 text-[var(--text)]" dir="rtl">
        {/* كروت مدمجة — ألوان نيون محددة */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Neon Blue — إيقاف الحجوزات */}
          <div className="em-card em-card--blue rounded-xl border p-3.5">
            <div className="flex items-start gap-2.5">
              <Power
                className="em-card-icon-cyan mt-0.5 h-5 w-5 shrink-0 text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.35)]"
                strokeWidth={2}
                aria-hidden
              />
              <div className="min-w-0 flex-1 text-end">
                <h3 className="text-sm font-bold text-[var(--text)]">إيقاف الحجوزات</h3>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--muted)]">إيقاف مؤقت لجميع الحجوزات.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={bookingsStopped}
              aria-label={bookingsStopped ? "إيقاف الحجوزات نشط" : "إيقاف الحجوزات غير نشط"}
              onClick={handleBookingsToggle}
              className="em-bookings-switch mt-3 flex w-full items-center justify-between gap-3"
            >
              <span
                className={`em-bookings-switch__icon ${bookingsStopped ? "em-bookings-switch__icon--on" : "em-bookings-switch__icon--off"}`}
                aria-hidden
              >
                {bookingsStopped ? (
                  <Ban className="h-6 w-6" strokeWidth={2.25} />
                ) : (
                  <Power className="h-6 w-6" strokeWidth={2} />
                )}
              </span>
              <span
                className={`em-bookings-switch__label ${bookingsStopped ? "em-bookings-switch__label--on" : ""}`}
              >
                {bookingsStopped ? "نشط" : "غير نشط"}
              </span>
            </button>
          </div>

          {/* Neon Red — تسجيل حالة */}
          <div className="em-card em-card--red rounded-xl border p-3.5">
            <div className="flex items-start gap-2.5">
              <IconGlyph icon={ShieldAlert} tone="red" size={16} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1 text-end">
                <h3 className="text-sm font-bold text-[var(--text)]">تسجيل حالة طارئة</h3>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--muted)]">تسجيل حالة جديدة في النظام.</p>
              </div>
            </div>
            <button type="button" onClick={openRegister} className="zones-add-btn mt-3 w-full shrink-0 justify-center py-2.5 text-[12px]">
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              تسجيل حالة
            </button>
          </div>

          {/* إشعار طارئ — زر ونافذة نيون أحمر */}
          <div className="em-card em-card--notify rounded-xl border p-3.5">
            <div className="flex items-start gap-2.5">
              <IconGlyph icon={Bell} tone="red" size={16} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1 text-end">
                <h3 className="text-sm font-bold text-[var(--text)]">إرسال إشعار طارئ</h3>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--muted)]">إشعار فوري للمستهدفين.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotifyTarget("employees");
                setNotifyText("");
                setNotifyOpen(true);
              }}
              className="em-neon-send-btn mt-3 w-full py-2.5 text-center text-[12px] font-bold"
            >
              إرسال إشعار
            </button>
          </div>
        </div>

        {/* سجل الطوارئ — نفس بنية جدول إدارة الأجهزة */}
        <div
          className="rounded-2xl border border-slate-800/90 bg-[#121722]/85 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-5"
          data-zones-table
        >
          <h2 className="mb-3 text-end text-sm font-bold text-[var(--text)]">سجل الطوارئ</h2>
          {logsError ? (
            <p className="mb-3 text-end text-[11px] font-semibold text-red-400">{logsError}</p>
          ) : null}
          <div className="zones-toolbar mb-4">
            <div className="zones-toolbar__search relative min-w-[200px]">
              <FileText className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="بحث في السجل..."
                className="w-full rounded-full border border-[#6B5478]/55 bg-[#0b0e14]/90 py-2.5 pe-10 ps-3 text-[12px] text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/30"
              />
            </div>
            <button type="button" onClick={openRegister} className="zones-toolbar__add zones-add-btn">
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.25} />
              تسجيل حالة
            </button>
          </div>

          <TableSelectionModeBar
            selectionMode={selection.selectionMode}
            onEnter={selection.enterSelectionMode}
            onExit={selection.exitSelectionMode}
            count={selection.count}
            totalCount={filteredLogs.length}
            onClear={selection.clearSelection}
            actions={[{ label: "حذف المحدد", icon: Trash2, onClick: handleBulkDelete, variant: "danger" }]}
          />

          <div className="overflow-x-auto rounded-xl border border-slate-800/80" data-zones-table-wrap>
            <table className="em-table w-full min-w-[640px] border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-800/90 bg-[#0b0e14]/70 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                  <TableSelectHeaderCell {...selection} />
                  <th className="px-3 py-3 text-end">#</th>
                  <th className="px-3 py-3 text-end">نوع الطوارئ</th>
                  <th className="px-3 py-3 text-end">الوصف</th>
                  <th className="px-3 py-3 text-end">تاريخ ووقت الحدوث</th>
                  <th className="px-3 py-3 text-end">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logsLoading ? (
                  <tr>
                    <td colSpan={tableSelectColSpan(TABLE_DATA_COLS, selection.selectionMode)} className="px-3 py-10 text-center text-[12px] text-slate-500">
                      جاري تحميل السجل من الخادم...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={tableSelectColSpan(TABLE_DATA_COLS, selection.selectionMode)} className="px-3 py-10 text-center text-[12px] text-slate-500">
                      لا توجد حالات طوارئ مسجّلة بعد.
                    </td>
                  </tr>
                ) : null}
                {pagedLogs.map((row, idx) => {
                  const Icon = rowIcon(row.typeValue);
                  const label = rowLabel(row.typeValue);
                  const rowNum = (logPage - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr
                      key={row.id}
                      className={`transition odd:bg-[#0f131a]/40 even:bg-[#121722]/30 hover:bg-[#151a24]/80 ${
                        selection.selectionMode
                          ? selectableRowClass(selection.isSelected(row.id), "")
                          : ""
                      }`}
                    >
                      <TableSelectRowCell id={row.id} ariaLabel={`تحديد السجل ${rowNum}`} {...selection} />
                      <td className="px-3 py-3 text-end font-medium text-slate-400">{rowNum}</td>
                      <td className="px-3 py-3 text-end">
                        <span className="inline-flex items-center justify-end gap-1.5">
                          <Icon className="h-4 w-4 shrink-0 text-violet-200" strokeWidth={2} />
                          <span className="font-medium text-slate-100">{label}</span>
                        </span>
                      </td>
                      <td className="max-w-[220px] px-3 py-3 text-end text-slate-300">
                        <span className="line-clamp-2">{row.description}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-end font-mono text-[12px] text-slate-400">{row.occurredAt}</td>
                      <td className="px-3 py-3 text-end">
                        <IconButton
                          icon={Trash2}
                          label={
                            selection.isSelected(row.id) && selection.count > 1
                              ? `حذف ${selection.count}`
                              : "حذف"
                          }
                          tone="danger"
                          size={16}
                          onClick={() => deleteRow(row)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="zones-table-pager mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-slate-800/80 pt-3">
              <button
                type="button"
                disabled={logPage <= 1}
                onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                className="zones-table-pager__btn rounded-lg border border-slate-700/80 bg-[#0f141d] px-3 py-2 text-[12px] font-medium text-slate-300 transition hover:border-violet-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                السابق
              </button>
              <span className="flex min-w-[2.5rem] items-center justify-center rounded-lg bg-gradient-to-r from-[#6366f1] to-[#a855f7] px-2.5 py-2 text-center text-[12px] font-bold tabular-nums text-white shadow-md shadow-violet-600/25">
                {logPage}
              </span>
              <span className="zones-table-pager__meta text-[11px] text-slate-500">من {totalPages}</span>
              <button
                type="button"
                disabled={logPage >= totalPages}
                onClick={() => setLogPage((p) => Math.min(totalPages, p + 1))}
                className="zones-table-pager__btn rounded-lg border border-slate-700/80 bg-[#0f141d] px-3 py-2 text-[12px] font-medium text-slate-300 transition hover:border-violet-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                التالي
              </button>
            </div>
          ) : null}

          {archivedCount > 0 ? (
            <p className="mt-3 text-end text-[11px] text-[var(--muted)]">الأرشيف: {archivedCount} سجل</p>
          ) : null}
        </div>
      </div>

      {/* Modal تسجيل */}
      {registerOpen ? (
        <div className="em-modal-root fixed inset-0 z-[80] flex items-center justify-center p-3">
          <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-label="إغلاق" onClick={() => setRegisterOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="em-modal em-modal--red em-modal-register relative w-full max-w-[22rem] rounded-xl border border-red-900/50 bg-gradient-to-b from-[#1a0a0c] to-[#080305] p-4 shadow-[0_0_40px_rgba(127,29,29,0.35)]"
            dir="rtl"
          >
            <h3 className="text-end text-sm font-bold text-red-100 drop-shadow-[0_0_14px_rgba(248,113,113,0.45)]">
              تسجيل حالة طارئة
            </h3>
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="em-reg-label mb-1 block text-end text-[10px] font-semibold uppercase tracking-wide">
                  نوع الطوارئ
                </label>
                <div className="relative">
                  <select
                    value={regForm.type}
                    onChange={(e) => setRegForm((f) => ({ ...f, type: e.target.value, otherLabel: "" }))}
                    className="em-select w-full cursor-pointer appearance-none rounded-lg border border-red-900/45 bg-[#120507] py-2 pe-3 ps-8 text-end text-xs text-red-50 outline-none transition hover:border-red-500/35"
                  >
                    {selectOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-red-300/55" aria-hidden />
                </div>
              </div>
              {regForm.type === "other" ? (
                <div>
                  <label className="em-reg-label em-reg-label--accent mb-1 block text-end text-[10px] font-semibold">
                    اكتب نوع الطوارئ
                  </label>
                  <input
                    type="text"
                    value={regForm.otherLabel}
                    onChange={(e) => setRegForm((f) => ({ ...f, otherLabel: e.target.value }))}
                    placeholder="مثال: تسرب مياه"
                    className="em-input w-full rounded-lg border border-red-900/40 bg-[#120507] px-2.5 py-2 text-end text-xs text-red-50 placeholder:text-red-200/35"
                  />
                </div>
              ) : null}
              <div>
                <label className="em-reg-label mb-1 block text-end text-[10px] font-semibold uppercase tracking-wide">الوصف</label>
                <textarea
                  value={regForm.description}
                  onChange={(e) => setRegForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="em-input em-textarea w-full resize-none rounded-lg border border-red-900/40 bg-[#120507] px-2.5 py-2 text-end text-xs text-red-50 placeholder:text-red-200/35"
                  placeholder="وصف مختصر..."
                />
              </div>
              <div>
                <label className="em-reg-label mb-1 block text-end text-[10px] font-semibold uppercase tracking-wide">
                  تاريخ ووقت الحدوث
                </label>
                <div className="relative">
                  <CalendarClock className="pointer-events-none absolute start-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-red-300/60" />
                  <input
                    type="datetime-local"
                    value={regForm.occurredAt}
                    onChange={(e) => setRegForm((f) => ({ ...f, occurredAt: e.target.value }))}
                    className="em-input w-full rounded-lg border border-red-900/40 bg-[#120507] py-2 ps-8 pe-2 text-xs text-red-50"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRegisterOpen(false)}
                className="em-reg-cancel rounded-lg border border-red-900/45 px-3 py-1.5 text-[11px] font-medium text-red-200/80 transition hover:bg-red-950/40"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={submitRegister}
                className="em-save-btn zones-add-btn rounded-lg px-4 py-2 text-[11px] font-bold"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal إشعار — Pills */}
      {notifyOpen ? (
        <div className="em-modal-root fixed inset-0 z-[80] flex items-center justify-center p-3">
          <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-label="إغلاق" onClick={() => setNotifyOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="em-modal em-modal-notify-neon relative w-full max-w-[22rem] rounded-xl border p-4"
            dir="rtl"
          >
            <h3 className="text-end text-sm font-bold text-red-100 drop-shadow-[0_0_14px_rgba(248,113,113,0.45)]">إرسال إشعار طارئ</h3>
            <p className="mt-0.5 text-end text-[10px] text-red-200/70">اختر المستهدف ثم النص.</p>

            <div className="mt-3 flex flex-col items-stretch gap-1.5" role="group" aria-label="المستهدف">
              {notifyPills.map((opt) => {
                const active = notifyTarget === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNotifyTarget(opt.id)}
                    className={`em-notify-target w-full rounded-lg border px-3 py-2 text-center text-[11px] font-bold transition ${
                      active ? "em-notify-target--active" : ""
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-end text-[10px] font-semibold uppercase tracking-wide text-red-300/80">نص الإشعار</label>
              <textarea
                value={notifyText}
                onChange={(e) => setNotifyText(e.target.value)}
                rows={4}
                className="em-input em-textarea em-notify-textarea w-full resize-none rounded-lg px-2.5 py-2 text-end text-xs text-red-50 placeholder:text-red-200/40"
                placeholder="نص الإشعار..."
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNotifyOpen(false)}
                className="em-notify-cancel-btn rounded-lg border px-3 py-2 text-[11px] font-medium transition"
              >
                إلغاء
              </button>
              <button type="button" onClick={submitNotify} className="em-notify-send-btn rounded-lg px-3 py-2 text-[11px] font-bold text-white">
                إرسال
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <StopBookingsFormModal
        open={stopModalOpen}
        onClose={() => setStopModalOpen(false)}
        onSubmit={handleStopSubmit}
      />
    </>
  );
}
