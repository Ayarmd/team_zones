import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import Button from "../../super-admin/components/ui/Button";
import { formatCalendarDate, getHallWorkHours } from "../utils/receptionCalendarUtils";
import {
  calcHourTo,
  generateBookingCode,
  getDevicePackageInfo,
  PAYMENT_TYPES,
  BOOKING_PAYMENT_OPTIONS,
} from "../data/receptionCalendarStorage";
import {
  canPayWithPoints,
  getCustomerPointsBalance,
  getLoyaltySettings,
} from "../../loyalty/data/loyaltyPointsStorage";
import ReceptionBookingVoucher from "./ReceptionBookingVoucher";
import { generateBookingVoucherPdf } from "../utils/generateBookingVoucherPdf";
export default function ReceptionCalendarBookModal({
  open,
  device,
  date,
  hour,
  onClose,
  onConfirm,
}) {
  const [step, setStep] = useState(1);
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentType, setPaymentType] = useState(PAYMENT_TYPES.cash.value);
  const [bookingCode, setBookingCode] = useState("");
  const voucherRef = useRef(null);

  const pkg = device ? getDevicePackageInfo(device) : null;
  const hourTo = hour && pkg ? calcHourTo(hour, pkg.hours) : hour;
  const hallName = getHallWorkHours().hallName;
  const loyaltySettings = getLoyaltySettings();
  const pointsBalance = phone.trim() ? getCustomerPointsBalance(phone) : 0;
  const pointsPayEnabled = phone.trim() ? canPayWithPoints(phone) : false;

  const paymentOptions = BOOKING_PAYMENT_OPTIONS.filter(
    (p) => p.value !== PAYMENT_TYPES.points.value || pointsPayEnabled,
  );

  useEffect(() => {
    if (paymentType === PAYMENT_TYPES.points.value && !pointsPayEnabled) {
      setPaymentType(PAYMENT_TYPES.cash.value);
    }
  }, [paymentType, pointsPayEnabled]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setVisitorName("");
    setPhone("");
    setEmail("");
    setPaymentType(PAYMENT_TYPES.cash.value);
    setBookingCode(generateBookingCode("manual"));
  }, [open, device?.id, date, hour]);

  if (!open || !device) return null;

  const voucher = {
    bookingCode,
    bookingType: "حجز يدوي — استقبال",
    visitorName: visitorName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    deviceName: device.name,
    packageName: pkg?.packageName || "—",
    packagePrice: pkg?.packagePrice || "—",
    date,
    hour,
    hourTo,
    paymentType,
  };

  const goToVoucher = (e) => {
    e.preventDefault();
    if (!visitorName.trim() || !phone.trim()) return;
    setStep(2);
  };

  const downloadPdf = async () => {
    if (!voucherRef.current) return;
    await generateBookingVoucherPdf(
      voucherRef.current,
      `${bookingCode}-voucher.pdf`,
    );
  };

  const confirmSave = () => {
    onConfirm({
      bookingCode,
      visitorName: visitorName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: "",
      paymentType,
      isPaid: paymentType === PAYMENT_TYPES.paid.value || paymentType === PAYMENT_TYPES.points.value,
      packageId: pkg?.packageId ?? null,
      packageName: pkg?.packageName || "—",
      packagePrice: pkg?.packagePrice || "—",
      hourTo,
      source: "manual",
    });
  };

  return (
    <div className="rcal-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="rcal-modal rcal-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-label="حجز موعد"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 1 ? (
          <form onSubmit={goToVoucher}>
            <h3 className="rcal-modal-title">حجز موعد — بيانات الزبون</h3>
            <p className="mb-4 text-[11px] font-semibold text-gray-500">
              الحقول الثابتة من التقويم — أكمل بيانات الزبون ثم اضغط التالي لعرض الوصل
            </p>

            <div className="rcal-modal-info">
              <InfoRow label="التاريخ" value={formatCalendarDate(date)} />
              <InfoRow label="من ساعة" value={hour} ltr />
              <InfoRow label="إلى ساعة" value={hourTo} ltr />
              <InfoRow label="الجهاز" value={device.name} ltr />
              <InfoRow
                label="الباقة / السعر"
                value={`${pkg?.packageName || "—"} — ${pkg?.packagePrice || "—"}`}
              />
              <InfoRow label="رقم الحجز" value={bookingCode} ltr />
            </div>

            <label className="rcal-modal-field">
              <span className="rcal-modal-label">
                اسم الزبون <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                className="rcal-modal-input"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                required
                placeholder="الاسم الكامل"
              />
            </label>

            <label className="rcal-modal-field">
              <span className="rcal-modal-label">
                رقم الهاتف <span className="text-red-500">*</span>
              </span>
              <input
                type="tel"
                className="rcal-modal-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                dir="ltr"
                placeholder="09xxxxxxxx"
              />
            </label>

            <label className="rcal-modal-field">
              <span className="rcal-modal-label">البريد الإلكتروني (اختياري)</span>
              <input
                type="email"
                className="rcal-modal-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                placeholder="للزبائن غير المسجلين في التطبيق"
              />
            </label>

            <label className="rcal-modal-field">
              <span className="rcal-modal-label">نوع الدفع</span>
              {phone.trim() ? (
                <p className="mb-2 text-[10px] font-semibold text-[#6B5478]">
                  رصيد النقاط: {pointsBalance} — الحد الأدنى للدفع: {loyaltySettings.redemptionThreshold} نقطة
                  {pointsPayEnabled
                    ? ` (يُخصم ${loyaltySettings.redemptionThreshold} — يبقى ${pointsBalance - loyaltySettings.redemptionThreshold})`
                    : " (غير كافٍ)"}
                </p>
              ) : null}
              <select
                className="rcal-modal-input"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                {paymentOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rcal-modal-actions">
              <Button type="submit" size="md">
                التالي — وصل الحجز
              </Button>
              <Button type="button" variant="outline" size="md" onClick={onClose}>
                إلغاء
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <h3 className="rcal-modal-title">وصل الحجز</h3>
            <div ref={voucherRef} className="mb-4">
              <ReceptionBookingVoucher voucher={voucher} hallName={hallName} />
            </div>
            <div className="rcal-modal-actions">
              <Button type="button" size="md" onClick={confirmSave}>
                حفظ وتسجيل في جدول الحجوزات
              </Button>
              <Button type="button" variant="outline" size="md" onClick={downloadPdf}>
                <Download size={16} />
                تحميل PDF
              </Button>
              <Button type="button" variant="outline" size="md" onClick={() => setStep(1)}>
                رجوع
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, ltr }) {
  return (
    <div className="rcal-modal-info-row">
      <span className="rcal-modal-info-label">{label}</span>
      <span className="rcal-modal-info-value" dir={ltr ? "ltr" : undefined}>
        {value}
      </span>
    </div>
  );
}
