import Button from "../../super-admin/components/ui/Button";
import { paymentTypeLabel } from "../data/receptionCalendarStorage";
import { formatCalendarDate } from "../utils/receptionCalendarUtils";

export default function ReceptionCalendarReservedModal({
  open,
  device,
  date,
  hour,
  slot,
  onClose,
  onCancelBooking,
}) {
  if (!open || !device || !slot) return null;

  const hasCustomer = Boolean(slot.visitorName?.trim());

  return (
    <div className="rcal-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="rcal-modal"
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل الحجز"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="rcal-modal-title">تفاصيل الحجز</h3>

        <div className="rcal-modal-info">
          <div className="rcal-modal-info-row">
            <span className="rcal-modal-info-label">رقم الحجز</span>
            <span className="rcal-modal-info-value font-extrabold text-[#6B5478]" dir="ltr">
              {slot.bookingCode || slot.visitorNumber || "—"}
            </span>
          </div>
          <div className="rcal-modal-info-row">
            <span className="rcal-modal-info-label">نوع الحجز</span>
            <span className="rcal-modal-info-value">{slot.bookingType || "—"}</span>
          </div>
          <div className="rcal-modal-info-row">
            <span className="rcal-modal-info-label">الجهاز</span>
            <span className="rcal-modal-info-value" dir="ltr">
              {device.name}
            </span>
          </div>
          <div className="rcal-modal-info-row">
            <span className="rcal-modal-info-label">الباقة / السعر</span>
            <span className="rcal-modal-info-value">
              {slot.packageName || "—"} — {slot.packagePrice || "—"}
            </span>
          </div>
          <div className="rcal-modal-info-row">
            <span className="rcal-modal-info-label">الموعد</span>
            <span className="rcal-modal-info-value">
              {formatCalendarDate(date)} —{" "}
              <span dir="ltr">
                {hour}
                {slot.hourTo && slot.hourTo !== hour ? ` → ${slot.hourTo}` : ""}
              </span>
            </span>
          </div>
          {hasCustomer ? (
            <>
              <div className="rcal-modal-info-row">
                <span className="rcal-modal-info-label">اسم الزبون</span>
                <span className="rcal-modal-info-value">{slot.visitorName}</span>
              </div>
              <div className="rcal-modal-info-row">
                <span className="rcal-modal-info-label">رقم الهاتف</span>
                <span className="rcal-modal-info-value" dir="ltr">
                  {slot.phone || "—"}
                </span>
              </div>
              {slot.email?.trim() ? (
                <div className="rcal-modal-info-row">
                  <span className="rcal-modal-info-label">البريد</span>
                  <span className="rcal-modal-info-value" dir="ltr">
                    {slot.email}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="rcal-modal-info-row">
            <span className="rcal-modal-info-label">نوع الدفع</span>
            <span className="rcal-modal-info-value">{paymentTypeLabel(slot.paymentType)}</span>
          </div>
          {slot.notes?.trim() ? (
            <div className="rcal-modal-info-row rcal-modal-info-row--stack">
              <span className="rcal-modal-info-label">ملاحظة</span>
              <span className="rcal-modal-info-value rcal-modal-notes">{slot.notes}</span>
            </div>
          ) : null}
        </div>

        <div className="rcal-modal-actions">
          <Button type="button" variant="dangerOutline" size="md" onClick={onCancelBooking}>
            إلغاء الحجز
          </Button>
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}
