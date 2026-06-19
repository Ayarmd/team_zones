import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Play, Square } from "lucide-react";
import { zonesConfirm, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import {
  cancelCalendarBooking,
  endCalendarSession,
  getSessionBookings,
  loadCalendarSlots,
  paymentTypeLabel,
  RECEPTION_CALENDAR_EVENT,
  SLOT_STATUS,
  startCalendarSession,
} from "../data/receptionCalendarStorage";
import { getCustomerPointsBalance } from "../../loyalty/data/loyaltyPointsStorage";
import { formatCurrency } from "../../finance/utils/financeData";
import { isAppBooking } from "../utils/receptionBookingsFilters";
import { loadCalendarDevices } from "../utils/receptionCalendarUtils";
import {
  formatSessionRemaining,
  getSessionRemainingMs,
} from "../utils/receptionSessionTimer";
import { DEVICES_STORAGE_EVENT } from "../../devices-packages/data/devicesStorage";
import "./ReceptionSessionPage.css";

function SessionStatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        active
          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
          : "bg-red-500/15 text-red-600 dark:text-red-400"
      }`}
    >
      {active ? "مشغول" : "محجوز"}
    </span>
  );
}

export default function ReceptionSessionPage() {
  const [slots, setSlots] = useState(() => loadCalendarSlots());
  const [devices, setDevices] = useState(() => loadCalendarDevices());
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(() => {
    setSlots(loadCalendarSlots());
    setDevices(loadCalendarDevices());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(RECEPTION_CALENDAR_EVENT, refresh);
    window.addEventListener(DEVICES_STORAGE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(RECEPTION_CALENDAR_EVENT, refresh);
      window.removeEventListener(DEVICES_STORAGE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const deviceMap = useMemo(() => new Map(devices.map((d) => [d.id, d])), [devices]);

  const sessions = useMemo(() => getSessionBookings(slots), [slots]);

  const hasActiveSession = useMemo(
    () => sessions.some((s) => s.status === SLOT_STATUS.active),
    [sessions],
  );

  useEffect(() => {
    if (!hasActiveSession) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasActiveSession]);

  const startSession = async (slot) => {
    const confirmed = await zonesConfirm({
      title: "بدء الجلسة؟",
      text: `بدء جلسة «${slot.visitorName}».`,
      confirmText: "بدء",
      cancelText: "إلغاء",
    });
    if (!confirmed) return;
    startCalendarSession(slot.deviceId, slot.date, slot.hour);
    refresh();
    zonesToastSuccess("بدأت الجلسة.");
  };

  const endSession = async (slot) => {
    const confirmed = await zonesConfirm({
      title: "إنهاء الجلسة؟",
      text: `سيتم إنهاء جلسة «${slot.visitorName}» وتحرير الموعد.`,
      confirmText: "إنهاء",
      cancelText: "إلغاء",
    });
    if (!confirmed) return;
    const result = endCalendarSession(slot.deviceId, slot.date, slot.hour);
    refresh();
    if (result.pointsResult?.ok) {
      zonesToastSuccess(
        `لقد حصل الزبون على ${result.pointsResult.earned} نقطة جديدة. الرصيد: ${result.pointsResult.balance}`,
        "نقاط الولاء",
      );
    } else if (result.revenueEntry?.revenue > 0) {
      zonesToastSuccess(
        `تم تسجيل ${formatCurrency(result.revenueEntry.revenue)} في إيرادات اليوم.`,
        "تم إنهاء الجلسة",
      );
    } else {
      zonesToastSuccess("تم إنهاء الجلسة.");
    }
  };

  const cancelSession = async (slot) => {
    const confirmed = await zonesConfirm({
      title: "إلغاء الحجز؟",
      text: `سيتم إلغاء حجز «${slot.visitorName}» وتحرير الموعد في التقويم.`,
      confirmText: "إلغاء الحجز",
      cancelText: "تراجع",
      icon: "warning",
    });
    if (!confirmed) return;
    cancelCalendarBooking(slot.id);
    refresh();
    zonesToastSuccess("تم إلغاء الحجز.");
  };

  return (
    <div dir="rtl">
      <PageHeader title="الجلسات" />

      <section className="rsess-wrap">
        <div className="rsess-head">
          <h2 className="rsess-title">جدول الجلسات</h2>
          <span className="rsess-count">{sessions.length} جلسة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="rsess-table">
            <thead>
              <tr>
                <th>رقم الحجز</th>
                <th>الزبون</th>
                <th>الجهاز</th>
                <th>الباقة</th>
                <th>الدفع</th>
                <th>نقاط</th>
                <th>التاريخ</th>
                <th>من — إلى</th>
                <th>الحالة</th>
                <th className={TABLE_ACTIONS_TH}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="rsess-empty">
                    لا توجد جلسات.
                  </td>
                </tr>
              ) : (
                sessions.map((slot) => {
                  const device = deviceMap.get(slot.deviceId);
                  const isActive = slot.status === SLOT_STATUS.active;
                  return (
                    <tr key={slot.id} className={isActive ? "rsess-row--active" : ""}>
                      <td className="rsess-num" dir="ltr">
                        {slot.bookingCode}
                      </td>
                      <td className="rsess-guest">{slot.visitorName || "—"}</td>
                      <td className="rsess-device">{device?.name || "—"}</td>
                      <td>{slot.packageName || "—"}</td>
                      <td>{paymentTypeLabel(slot.paymentType)}</td>
                      <td>
                        {isAppBooking(slot) ? (
                          <span className="inline-flex rounded-full bg-[#6B5478]/12 px-2 py-0.5 text-[11px] font-bold text-[#6B5478]">
                            {getCustomerPointsBalance(slot.phone)} نقطة
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td dir="ltr">{slot.date}</td>
                      <td className="rsess-hour" dir="ltr">
                        {slot.hour} — {slot.hourTo}
                      </td>
                      <td>
                        <SessionStatusBadge active={isActive} />
                      </td>
                      <td className={TABLE_ACTIONS_TD}>
                        <div className="rsess-actions">
                          {isActive ? (
                            <span
                              className={`rsess-timer ${getSessionRemainingMs(slot.date, slot.hour, slot.hourTo, now) === 0 ? "rsess-timer--done" : ""}`}
                              dir="ltr"
                            >
                              {formatSessionRemaining(getSessionRemainingMs(slot.date, slot.hour, slot.hourTo, now))}
                            </span>
                          ) : null}
                          <TableActionsGroup>
                            <IconButton
                              icon={Ban}
                              label="إلغاء"
                              tone="danger"
                              onClick={() => cancelSession(slot)}
                            />
                            <IconButton
                              icon={Play}
                              label="بدء الجلسة"
                              tone="brand"
                              disabled={isActive}
                              onClick={() => startSession(slot)}
                            />
                            <IconButton
                              icon={Square}
                              label="إنهاء الجلسة"
                              tone="warning"
                              disabled={!isActive}
                              onClick={() => endSession(slot)}
                            />
                          </TableActionsGroup>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
