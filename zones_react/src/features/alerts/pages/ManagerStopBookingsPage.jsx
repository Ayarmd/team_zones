import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Play } from "lucide-react";
import { zonesConfirm, zonesToastInfo, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import Button from "../../super-admin/components/ui/Button";
import TablePagination from "../../../shared/components/TablePagination";
import {
  BOOKINGS_STOP_EVENT,
  formatBookingsStopCode,
  getActiveBookingsStopRecord,
  isBookingsStopped,
  loadBookingsStopRecords,
  resumeBookingsStop,
  startBookingsStop,
} from "../data/bookingsStopStorage";
import { BOOKINGS_STOP_NAME } from "../data/bookingsStopMessages";
import StopBookingsFormModal from "../components/StopBookingsFormModal";
import { MANAGER_ALERTS_EVENT } from "../data/managerAlertsStorage";

const PAGE_SIZE = 8;

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        active
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {active ? "نشط" : "منتهى"}
    </span>
  );
}

export default function ManagerStopBookingsPage() {
  const [records, setRecords] = useState(() => loadBookingsStopRecords());
  const [stopped, setStopped] = useState(() => isBookingsStopped());
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [page, setPage] = useState(1);

  const refresh = useCallback(() => {
    setRecords(loadBookingsStopRecords());
    setStopped(isBookingsStopped());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(BOOKINGS_STOP_EVENT, refresh);
    window.addEventListener(MANAGER_ALERTS_EVENT, refresh);
    return () => {
      window.removeEventListener(BOOKINGS_STOP_EVENT, refresh);
      window.removeEventListener(MANAGER_ALERTS_EVENT, refresh);
    };
  }, [refresh]);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const paged = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeRecord = useMemo(() => getActiveBookingsStopRecord(), [records, stopped]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSendStop = () => {
    const result = startBookingsStop({ reason });
    if (!result.ok) {
      zonesToastInfo(result.error);
      return;
    }
    setModalOpen(false);
    setReason("");
    refresh();
    zonesToastSuccess("وصل الإشعار للموظفين والزبائن.", "تم إيقاف الحجوزات");
  };

  const handleResume = async () => {
    const confirmed = await zonesConfirm({
      title: "بدء الحجوزات؟",
      text: "سيتم فتح الحجز وإرسال إشعار للموظفين والزبائن.",
      confirmText: "بدء الحجوزات",
      cancelText: "إلغاء",
    });
    if (!confirmed) return;

    const result = resumeBookingsStop();
    if (!result.ok) {
      zonesToastInfo(result.error);
      return;
    }
    refresh();
    zonesToastSuccess("تم بدء الحجوزات");
  };

  return (
    <ManagerLayout>
      <div className="space-y-4" dir="rtl">
        <PageHeader
          title="إيقاف الحجوزات"
          description="إدارة إيقاف وبدء الحجوزات — مع إشعار تلقائي للموظفين والزبائن."
        />

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">سجل إيقاف الحجوزات</h2>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {stopped ? "الحجوزات متوقفة حالياً — لا يمكن للاستقبال حجز زائر." : "الحجوزات متاحة للحجز."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!stopped ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setReason("");
                    setModalOpen(true);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Ban className="h-4 w-4" />
                  إيقاف الحجوزات
                </Button>
              ) : (
                <Button size="sm" onClick={handleResume}>
                  <Play className="h-4 w-4" />
                  بدء الحجوزات
                </Button>
              )}
            </div>
          </div>

          {activeRecord ? (
            <div className="border-b border-red-100 bg-red-50/60 px-5 py-3 dark:border-red-900/30 dark:bg-red-950/20">
              <p className="text-xs font-bold text-red-700 dark:text-red-300">
                إيقاف نشط — {formatBookingsStopCode(activeRecord.id)} — السبب: {activeRecord.reason}
              </p>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-3 py-2.5 font-bold">الرقم</th>
                  <th className="px-3 py-2.5 font-bold">الاسم</th>
                  <th className="px-3 py-2.5 font-bold">السبب</th>
                  <th className="px-3 py-2.5 font-bold">تاريخ البداية</th>
                  <th className="px-3 py-2.5 font-bold">تاريخ النهاية</th>
                  <th className="px-3 py-2.5 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center">
                      <p className="text-gray-400">لا توجد سجلات إيقاف حجوزات بعد.</p>
                      {!stopped ? (
                        <p className="mt-2 text-[11px] font-semibold text-gray-500">
                          اضغط زر{" "}
                          <span className="text-red-600 dark:text-red-400">«إيقاف الحجوزات»</span>{" "}
                          أعلاه لملء النموذج وإرسال الإشعار.
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  paged.map((row) => (
                    <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-3 font-bold text-[#6B5478]" dir="ltr">
                        {formatBookingsStopCode(row.id)}
                      </td>
                      <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">
                        {BOOKINGS_STOP_NAME}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.reason || "—"}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500" dir="ltr">
                        {row.startDate}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500" dir="ltr">
                        {row.endDate || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge active={row.status === "active"} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={records.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </section>

        <StopBookingsFormModal
          open={modalOpen}
          reason={reason}
          onReasonChange={setReason}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSendStop}
        />
      </div>
    </ManagerLayout>
  );
}
