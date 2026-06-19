import { CheckCircle2, ExternalLink, MapPin, X, XCircle } from "lucide-react";
import IconButton from "../../../shared/components/ui/IconButton";
import { HALL_REQUEST_STATUS } from "../data/hallRequestStatus";
import { getSuperAdminState } from "../data/superAdminStorage";
import HallRequestStatusBadge from "./HallRequestStatusBadge";

function Row({ label, value, ltr, isLink, href }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2.5 text-xs last:border-0 dark:border-gray-800">
      <span className="shrink-0 font-semibold text-gray-500 dark:text-gray-400">{label}</span>
      {isLink ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 font-bold text-[#6B5478]"
        >
          <ExternalLink size={12} /> فتح الرابط
        </a>
      ) : (
        <span className="text-left font-bold text-gray-800 dark:text-gray-100" dir={ltr ? "ltr" : undefined}>
          {value}
        </span>
      )}
    </div>
  );
}

export default function HallRequestDetailsModal({ request, onClose, onAccept, onReject }) {
  if (!request) return null;
  const isPending = request.status === HALL_REQUEST_STATUS.pending || !request.status;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">تفاصيل صالة — {request.hallName}</h2>
          <IconButton icon={X} label="إغلاق" tone="muted" onClick={onClose} />
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-3 gap-2">
            {(request.images || []).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${request.hallName} ${i + 1}`}
                className="h-24 w-full rounded-xl object-cover"
              />
            ))}
          </div>

          <div className="rounded-xl border border-gray-100 px-4 py-1 dark:border-gray-800">
            <Row label="اسم الصالة" value={request.hallName} />
            <Row label="العنوان" value={request.address} />
            <Row label="المدينة" value={request.city} />
            <Row label="الهاتف التجاري" value={request.commercialPhone} ltr />
            <Row
              label="نسبة العمولة"
              value={`${request.commissionRate ?? getSuperAdminState().systemSettings.globalCommissionRate ?? 3}%`}
            />
            <Row label="اسم مدير الصالة" value={request.managerName} />
            <Row label="البريد الإلكتروني" value={request.managerEmail} ltr />
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 text-xs last:border-0 dark:border-gray-800">
              <span className="shrink-0 font-semibold text-gray-500 dark:text-gray-400">حالة الطلب</span>
              <HallRequestStatusBadge status={request.status} />
            </div>
            {request.rejectionReason ? (
              <Row label="سبب الرفض" value={request.rejectionReason} />
            ) : null}
            <Row
              label="تاريخ الطلب"
              value={`${request.submittedAt?.replaceAll("-", "/")} - ${request.submittedTime || ""}`}
              ltr
            />
          </div>

          <a
            href={request.mapLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-[#6B5478]/40 bg-[#6B5478]/8 py-2.5 text-xs font-bold text-[#6B5478]"
          >
            <MapPin size={15} /> عرض موقع الصالة على الخريطة
          </a>

          {isPending ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAccept(request)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <CheckCircle2 size={15} /> قبول الطلب
              </button>
              <button
                onClick={() => onReject(request)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-300 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
              >
                <XCircle size={15} /> رفض الطلب
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
