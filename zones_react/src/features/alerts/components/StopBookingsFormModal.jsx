import { useMemo } from "react";
import { AlertTriangle, Ban } from "lucide-react";
import AdminModal from "../../devices-packages/components/AdminModal";
import { Select, alertFormReadOnlyCls } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  BOOKINGS_STOP_ACTION,
  BOOKINGS_STOP_REASONS,
} from "../data/bookingsStopMessages";
import { formatAlertDateTime } from "../data/alertsMeta";
import {
  formatBookingsStopCode,
  nextBookingsStopId,
  loadBookingsStopRecords,
} from "../data/bookingsStopStorage";

const reasonOptions = BOOKINGS_STOP_REASONS.map((item) => ({
  value: item.value,
  label: item.label,
}));

const actionOptions = [
  { value: BOOKINGS_STOP_ACTION.value, label: BOOKINGS_STOP_ACTION.label },
];

export default function StopBookingsFormModal({ open, reason, onReasonChange, onClose, onSubmit }) {
  const previewId = useMemo(() => (open ? nextBookingsStopId(loadBookingsStopRecords()) : null), [open]);
  const previewStart = useMemo(() => (open ? formatAlertDateTime() : "—"), [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit();
  };

  return (
    <AdminModal open={open} onClose={onClose} title="إيقاف الحجوزات" wide>
      <form className="mt-4 space-y-5" onSubmit={handleSubmit} dir="rtl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-[10px] font-bold text-gray-400">رقم السجل</Label>
            <p className={`${alertFormReadOnlyCls} font-bold text-[#6B5478]`} dir="ltr">
              {previewId ? formatBookingsStopCode(previewId) : "—"}
            </p>
          </div>

          <div>
            <Label className="mb-1.5 block text-[10px] font-bold text-gray-400">نوع الإجراء</Label>
            <Select
              value={BOOKINGS_STOP_ACTION.value}
              onValueChange={() => {}}
              options={actionOptions}
              disabled
            />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-[10px] font-bold text-gray-400">سبب الإيقاف</Label>
          <Select
            value={reason}
            onValueChange={onReasonChange}
            options={reasonOptions}
            placeholder="اختر سبب الإيقاف..."
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-[10px] font-bold text-gray-400">تاريخ ووقت البدء</Label>
            <p className={alertFormReadOnlyCls} dir="ltr">
              {previewStart}
            </p>
          </div>

          <div>
            <Label className="mb-1.5 block text-[10px] font-bold text-gray-400">تاريخ ووقت الانتهاء (المتوقع)</Label>
            <p className={alertFormReadOnlyCls} dir="ltr">
              —
            </p>
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" strokeWidth={2.25} />
          عند الإرسال يُبلّغ موظفو الاستقبال والصيانة والزبائن برسالة ثابتة من النظام.
        </p>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-2 text-xs font-bold text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={!reason.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950 dark:hover:bg-red-900"
          >
            <Ban size={14} strokeWidth={2.25} />
            تأكيد إيقاف الحجوزات
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
