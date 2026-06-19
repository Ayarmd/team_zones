import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { zonesToastSuccess, zonesToastWarning } from "../../../shared/utils/zonesAlerts";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import ReceptionCalendarBookModal from "../components/ReceptionCalendarBookModal";
import ReceptionCalendarReservedModal from "../components/ReceptionCalendarReservedModal";
import ReceptionDatePicker from "../components/ReceptionDatePicker";
import { DEVICES_STORAGE_EVENT } from "../../devices-packages/data/devicesStorage";
import { MAINTENANCE_FAULTS_EVENT } from "../../maintenance/data/maintenanceFaultsStorage";
import {
  BOOKINGS_STOP_EVENT,
  getBookingsStopBlockMessage,
  isBookingsStopped,
} from "../../alerts/data/bookingsStopStorage";
import {
  bookCalendarSlot,
  cancelCalendarBooking,
  loadCalendarSlots,
  RECEPTION_CALENDAR_EVENT,
  todayIso,
} from "../data/receptionCalendarStorage";
import {
  buildWorkHourSlots,
  CELL_KIND,
  CELL_META,
  formatCalendarDate,
  getHallWorkHours,
  loadCalendarDevices,
  resolveCellKind,
} from "../utils/receptionCalendarUtils";
import "./ReceptionCalendarPage.css";

function shiftDate(iso, deltaDays) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export default function ReceptionCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [slots, setSlots] = useState(() => loadCalendarSlots());
  const [devices, setDevices] = useState(() => loadCalendarDevices());
  const [bookTarget, setBookTarget] = useState(null);
  const [reservedTarget, setReservedTarget] = useState(null);
  const [bookingsStopped, setBookingsStopped] = useState(() => isBookingsStopped());
  const hall = useMemo(() => getHallWorkHours(), []);
  const hours = useMemo(() => buildWorkHourSlots(hall.from, hall.to), [hall.from, hall.to]);

  const refresh = useCallback(() => {
    setSlots(loadCalendarSlots());
    setDevices(loadCalendarDevices());
    setBookingsStopped(isBookingsStopped());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(RECEPTION_CALENDAR_EVENT, refresh);
    window.addEventListener(DEVICES_STORAGE_EVENT, refresh);
    window.addEventListener(MAINTENANCE_FAULTS_EVENT, refresh);
    window.addEventListener("manager-hall-updated", refresh);
    window.addEventListener(BOOKINGS_STOP_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(RECEPTION_CALENDAR_EVENT, refresh);
      window.removeEventListener(DEVICES_STORAGE_EVENT, refresh);
      window.removeEventListener(MAINTENANCE_FAULTS_EVENT, refresh);
      window.removeEventListener("manager-hall-updated", refresh);
      window.removeEventListener(BOOKINGS_STOP_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const confirmBook = (payload) => {
    if (!bookTarget) return;
    const res = bookCalendarSlot({
      deviceId: bookTarget.device.id,
      date: selectedDate,
      hour: bookTarget.hour,
      hourTo: payload.hourTo,
      visitorName: payload.visitorName,
      phone: payload.phone,
      email: payload.email,
      notes: payload.notes,
      packageId: payload.packageId,
      packageName: payload.packageName,
      packagePrice: payload.packagePrice,
      paymentType: payload.paymentType,
      isPaid: payload.isPaid,
      bookingCode: payload.bookingCode,
      source: payload.source || "manual",
    });
    if (!res.ok) {
      zonesToastWarning(`لا يمكن الحجز — ${res.error || getBookingsStopBlockMessage()}`);
      return;
    }
    setBookTarget(null);
    refresh();
    zonesToastSuccess(
      `رقم الحجز ${payload.bookingCode} — انتقل إلى صفحة الجلسات لبدء اللعب.`,
      "تم الحجز",
    );
  };

  const cancelReservedBooking = () => {
    if (!reservedTarget?.slot?.id) return;
    cancelCalendarBooking(reservedTarget.slot.id);
    setReservedTarget(null);
    refresh();
  };

  const onCellClick = (device, hour) => {
    const kind = resolveCellKind(device, selectedDate, hour, slots);
    const slot = slots.find((s) => s.deviceId === device.id && s.date === selectedDate && s.hour === hour);

    if (kind === CELL_KIND.available) {
      if (bookingsStopped) {
        zonesToastWarning(`الحجوزات متوقفة — ${getBookingsStopBlockMessage()}`);
        return;
      }
      setBookTarget({ device, hour });
      return;
    }

    if (kind === CELL_KIND.reserved && slot) {
      setReservedTarget({ device, hour, slot });
    }
  };

  return (
    <div dir="rtl">
      <PageHeader title="تقويم الحجوزات" />

      {bookingsStopped ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {getBookingsStopBlockMessage()}
        </div>
      ) : null}

      <section className="rcal-wrap">
        <div className="rcal-toolbar">
          <div className="rcal-date-row">
            <button
              type="button"
              onClick={() => setSelectedDate(todayIso())}
              className="rcal-today-btn"
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
              className="rcal-nav-btn"
              aria-label="اليوم السابق"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
            <ReceptionDatePicker value={selectedDate} onChange={setSelectedDate} />
            <button
              type="button"
              onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
              className="rcal-nav-btn"
              aria-label="اليوم التالي"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="text-end">
            <p className="rcal-toolbar-date">{formatCalendarDate(selectedDate)}</p>
            <span className="rcal-hours-banner mt-1">
              <Clock size={13} />
              ساعات العمل: {hall.label}
            </span>
          </div>
        </div>

        <div className="rcal-scroll">
          <table className="rcal-table" dir="rtl">
            <colgroup>
              <col className="rcal-col-device" />
              {hours.map((hour) => (
                <col key={hour} className="rcal-col-hour" />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="rcal-sticky-device">الجهاز</th>
                {hours.map((hour) => (
                  <th key={hour} className="rcal-hour-head">
                    <span className="rcal-hour-label">{hour}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={hours.length + 1} className="px-4 py-10 text-center text-gray-400">
                    لا توجد أجهزة مضافة من المدير.
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id}>
                    <td className="rcal-sticky-device">
                      <span className="rcal-device-name">{device.name}</span>
                      <span className="rcal-device-type">{device.typeLabel}</span>
                    </td>
                    {hours.map((hour) => {
                      const kind = resolveCellKind(device, selectedDate, hour, slots);
                      const meta = CELL_META[kind];
                      const slot = slots.find(
                        (s) => s.deviceId === device.id && s.date === selectedDate && s.hour === hour,
                      );
                      const short =
                        kind === CELL_KIND.reserved || kind === CELL_KIND.active
                          ? slot?.visitorName?.split(" ")[0] ||
                            slot?.bookingCode ||
                            meta.label
                          : meta.label;

                      return (
                        <td key={hour} className={`rcal-cell ${meta.className}`}>
                          <button
                            type="button"
                            className="rcal-cell-btn"
                            title={meta.hint}
                            disabled={kind === CELL_KIND.maintenance || kind === CELL_KIND.active}
                            onClick={() => onCellClick(device, hour)}
                          >
                            {short}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rcal-legend">
          {[
            { key: "maintenance", color: "#9ca3af" },
            { key: "reserved", color: "#ef4444" },
            { key: "available", color: "#22c55e" },
            { key: "active", color: "#3b82f6" },
          ].map(({ key, color }) => (
            <span key={key} className="rcal-legend-item">
              <span className="rcal-legend-swatch" style={{ background: color }} />
              <span className="rcal-legend-label">{CELL_META[key].label}</span>
            </span>
          ))}
        </div>
      </section>

      <ReceptionCalendarBookModal
        open={Boolean(bookTarget)}
        device={bookTarget?.device}
        date={selectedDate}
        hour={bookTarget?.hour}
        onClose={() => setBookTarget(null)}
        onConfirm={confirmBook}
      />

      <ReceptionCalendarReservedModal
        open={Boolean(reservedTarget)}
        device={reservedTarget?.device}
        date={selectedDate}
        hour={reservedTarget?.hour}
        slot={reservedTarget?.slot}
        onClose={() => setReservedTarget(null)}
        onCancelBooking={cancelReservedBooking}
      />
    </div>
  );
}
