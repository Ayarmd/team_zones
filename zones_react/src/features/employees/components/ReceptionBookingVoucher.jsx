import { formatCalendarDate } from "../utils/receptionCalendarUtils";
import { paymentTypeLabel } from "../data/receptionCalendarStorage";

export default function ReceptionBookingVoucher({ voucher, hallName = "ZONES Gaming Center" }) {
  if (!voucher) return null;

  return (
    <div
      className="mx-auto w-full max-w-md rounded-2xl border-2 border-[#6B5478]/30 bg-white p-6 text-right shadow-lg"
      dir="rtl"
    >
      <div className="mb-4 border-b border-dashed border-gray-200 pb-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B5478]">ZONES</p>
        <h2 className="mt-1 text-lg font-extrabold text-gray-900">وصل حجز</h2>
        <p className="text-xs text-gray-500">{hallName}</p>
      </div>

      <div className="mb-4 rounded-xl bg-[#6B5478]/8 px-4 py-3 text-center">
        <p className="text-[10px] font-bold text-gray-500">رقم الحجز</p>
        <p className="text-2xl font-extrabold text-[#6B5478]" dir="ltr">
          {voucher.bookingCode}
        </p>
        <p className="mt-1 text-xs font-semibold text-gray-600">{voucher.bookingType}</p>
      </div>

      <dl className="space-y-2.5 text-xs">
        <Row label="اسم الزبون" value={voucher.visitorName} />
        <Row label="رقم الهاتف" value={voucher.phone} ltr />
        {voucher.email ? <Row label="البريد" value={voucher.email} ltr /> : null}
        <Row label="الجهاز" value={voucher.deviceName} ltr />
        <Row label="الباقة" value={`${voucher.packageName} — ${voucher.packagePrice}`} />
        <Row label="التاريخ" value={formatCalendarDate(voucher.date)} />
        <Row label="من ساعة" value={voucher.hour} ltr />
        <Row label="إلى ساعة" value={voucher.hourTo} ltr />
        <Row label="نوع الدفع" value={paymentTypeLabel(voucher.paymentType)} />
      </dl>

      <p className="mt-5 text-center text-[10px] text-gray-400">
        احتفظ بهذا الوصل — صالح للعرض عند الاستقبال
      </p>
    </div>
  );
}

function Row({ label, value, ltr }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5">
      <dt className="font-bold text-gray-500">{label}</dt>
      <dd className={`font-extrabold text-gray-800 ${ltr ? "dir-ltr" : ""}`}>{value || "—"}</dd>
    </div>
  );
}
