import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, FileText, UserCheck } from "lucide-react";
import { zonesConfirm, zonesToastError, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import { filterItemsByIds } from "../../../shared/hooks/useTableSelection";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import TablePagination from "../../../shared/components/TablePagination";
import ReceptionBookingVoucherModal from "../components/ReceptionBookingVoucherModal";
import ReceptionBookingsDateNav from "../components/ReceptionBookingsDateNav";
import ReceptionBookingsSourceFilter from "../components/ReceptionBookingsSourceFilter";
import {
  checkInBooking,
  getAwaitingBookings,
  loadCalendarSlots,
  markNoShowCalendarBooking,
  NO_SHOW_GRACE_MS,
  parseSlotStartMs,
  paymentTypeLabel,
  RECEPTION_CALENDAR_EVENT,
  syncReceptionLiveState,
  todayIso,
} from "../data/receptionCalendarStorage";
import { isApiStaffSession, getActiveStaffSession } from "../../devices-packages/data/hallCatalogSync";
import { formatCalendarDate, getHallWorkHours, loadCalendarDevices } from "../utils/receptionCalendarUtils";
import {
  isAppBooking,
  isManualBooking,
} from "../utils/receptionBookingsFilters";
import { openBookingReceiptPdf } from "../utils/openBookingReceiptPdf";

import { useReceptionLiveSync } from "../hooks/useReceptionLiveSync";

const PAGE_SIZE = 10;

export default function ReceptionBookingsPage() {
  const [slots, setSlots] = useState(() => loadCalendarSlots());
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(() => todayIso());
  useReceptionLiveSync(selectedDate);
  const [page, setPage] = useState(1);
  const [voucherSlot, setVoucherSlot] = useState(null);

  const devices = useMemo(() => loadCalendarDevices(), [slots]);
  const deviceMap = useMemo(
    () => new Map(devices.map((d) => [String(d.id), d])),
    [devices],
  );
  const hallName = useMemo(() => getHallWorkHours().hallName, []);

  const reloadView = useCallback(() => {
    setSlots(loadCalendarSlots());
  }, []);

  const syncView = useCallback(async () => {
    if (isApiStaffSession(getActiveStaffSession())) {
      await syncReceptionLiveState(selectedDate);
    }
    reloadView();
  }, [selectedDate, reloadView]);

  useEffect(() => {
    syncView();
    window.addEventListener(RECEPTION_CALENDAR_EVENT, reloadView);
    window.addEventListener("focus", syncView);
    return () => {
      window.removeEventListener(RECEPTION_CALENDAR_EVENT, reloadView);
      window.removeEventListener("focus", syncView);
    };
  }, [syncView, reloadView]);

  const bookings = useMemo(() => {
    let list = getAwaitingBookings(slots).filter((b) => b.date === selectedDate);

    if (sourceFilter === "app") {
      list = list.filter(isAppBooking);
    } else if (sourceFilter === "manual") {
      list = list.filter(isManualBooking);
    }

    return list;
  }, [slots, selectedDate, sourceFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.bookingCode?.toLowerCase().includes(q) ||
        b.visitorName?.toLowerCase().includes(q) ||
        b.phone?.includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.bookingType?.toLowerCase().includes(q),
    );
  }, [bookings, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, sourceFilter, selectedDate]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    syncView();
  }, [selectedDate, syncView]);

  const handleOpenReceipt = async (row) => {
    if (!row?.id) return;
    try {
      await openBookingReceiptPdf(row.id);
    } catch {
      openVoucher(row);
    }
  };

  const runCheckIn = async (targetIds, rowForMessage) => {
    const isBulk = targetIds.length > 1;
    const targets = filterItemsByIds(bookings, targetIds);

    const confirmed = await zonesConfirm({
      title: isBulk ? `تسجيل حضور ${targetIds.length} حجوزات؟` : "تسجيل الحضور؟",
      text: isBulk
        ? `تأكيد حضور ${targetIds.length} حجوزات.`
        : `تأكيد حضور «${rowForMessage.visitorName}».`,
      confirmText: "تسجيل الحضور",
      cancelText: "إلغاء",
    });
    if (!confirmed) return;

    let success = 0;
    for (const row of targets) {
      const result = await checkInBooking(row.id);
      if (result.ok) success += 1;
    }

    if (success === 0) return;

    reloadView();
    zonesToastSuccess(
      isBulk ? `تم تسجيل حضور ${success} من ${targets.length} حجوزات` : "انتقل الحجز إلى صفحة الجلسات.",
      isBulk ? "تم تسجيل الحضور" : "تم تسجيل الحضور",
    );
  };

  const handleCheckIn = (row) => runCheckIn([row.id], row);

  const canMarkNoShow = (row) => {
    const startMs = parseSlotStartMs(row.date, row.hour);
    if (startMs == null) return false;
    return Date.now() >= startMs + NO_SHOW_GRACE_MS;
  };

  const handleNoShow = async (row) => {
    const confirmed = await zonesConfirm({
      title: "تسجيل عدم الحضور؟",
      text: `سيتم إلغاء حجز «${row.visitorName}» وتسجيله كغياب (No-Show).`,
      confirmText: "تسجيل الغياب",
      cancelText: "إلغاء",
      icon: "warning",
    });
    if (!confirmed) return;

    const result = await markNoShowCalendarBooking(row.id);
    if (!result.ok) {
      zonesToastError(result.error || "تعذر تسجيل عدم الحضور.");
      return;
    }

    reloadView();
    if (result.banCreated) {
      zonesToastSuccess("تم تسجيل الغياب وإنشاء حظر تلقائي للزبون.", "تم تسجيل No-Show");
      return;
    }
    zonesToastSuccess(
      result.noShowCount
        ? `تم التسجيل — عدد الغيابات الحالي: ${result.noShowCount}`
        : "تم تسجيل عدم الحضور وإلغاء الحجز.",
      "تم تسجيل No-Show",
    );
  };

  const openVoucher = (row) => {
    const device = deviceMap.get(row.deviceId);
    setVoucherSlot({
      bookingCode: row.bookingCode,
      bookingType: row.bookingType,
      visitorName: row.visitorName,
      phone: row.phone,
      email: row.email,
      deviceName: device?.name || row.deviceName || "—",
      packageName: row.packageName,
      packagePrice: row.packagePrice,
      date: row.date,
      hour: row.hour,
      hourTo: row.hourTo,
      paymentType: row.paymentType,
    });
  };

  return (
    <div dir="rtl" className="space-y-4">
      <PageHeader title="جدول الحجوزات" />

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">الحجوزات</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {formatCalendarDate(selectedDate)} — بانتظار تسجيل الحضور
            </p>
          </div>
          <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
            {filtered.length} حجز
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <SearchBar
            containerClassName="min-w-[180px] flex-1 max-w-md"
            value={search}
            onChange={setSearch}
            placeholder="بحث برقم الحجز أو الاسم أو الهاتف..."
          />

          <ReceptionBookingsDateNav
            inline
            value={selectedDate}
            onChange={setSelectedDate}
            className="shrink-0"
          />

          <ReceptionBookingsSourceFilter
            value={sourceFilter}
            onChange={setSourceFilter}
            className="shrink-0"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-3 py-2.5 font-bold">رقم الحجز</th>
                <th className="px-3 py-2.5 font-bold">نوع الحجز</th>
                <th className="px-3 py-2.5 font-bold">الزبون</th>
                <th className="px-3 py-2.5 font-bold">التاريخ / الوقت</th>
                <th className="px-3 py-2.5 font-bold">الجهاز</th>
                <th className="px-3 py-2.5 font-bold">الباقة</th>
                <th className="px-3 py-2.5 font-bold">الدفع</th>
                <th className="px-3 py-2.5 font-bold">الإجمالي</th>
                <th className="px-3 py-2.5 font-bold">الحالة</th>
                <th className="px-3 py-2.5 font-bold">الإيصال</th>
                <th className={TABLE_ACTIONS_TH}>الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center text-gray-400">
                    لا توجد حجوزات في هذا اليوم.
                  </td>
                </tr>
              ) : (
                paged.map((row) => {
                  const device = deviceMap.get(String(row.deviceId));
                  return (
                    <tr key={row.id}>
                      <td className="px-3 py-3 font-extrabold text-[#6B5478]" dir="ltr">
                        {row.bookingCode}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.bookingType}</td>
                      <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">
                        {row.visitorName || "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        <span className="block">{formatCalendarDate(row.date)}</span>
                        <span className="font-bold" dir="ltr">
                          {row.hour} → {row.hourTo}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold" dir="ltr">
                        {device?.name || row.deviceName || "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{row.packageName}</td>
                      <td className="px-3 py-3">{paymentTypeLabel(row.paymentType)}</td>
                      <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">
                        {row.totalPrice ? `${row.totalPrice} د.ل` : `${row.packagePrice} د.ل`}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                          لم يحضر
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <IconButton
                          icon={FileText}
                          label="عرض الإيصال"
                          tone="default"
                          onClick={() => handleOpenReceipt(row)}
                        />
                      </td>
                      <td className={TABLE_ACTIONS_TD}>
                        <TableActionsGroup>
                          <IconButton
                            icon={UserCheck}
                            label="تسجيل الحضور"
                            tone="brand"
                            onClick={() => handleCheckIn(row)}
                          />
                          {canMarkNoShow(row) ? (
                            <IconButton
                              icon={Ban}
                              label="تسجيل عدم الحضور"
                              tone="danger"
                              onClick={() => handleNoShow(row)}
                            />
                          ) : null}
                        </TableActionsGroup>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </section>

      <ReceptionBookingVoucherModal
        open={Boolean(voucherSlot)}
        voucher={voucherSlot}
        hallName={hallName}
        onClose={() => setVoucherSlot(null)}
      />
    </div>
  );
}
