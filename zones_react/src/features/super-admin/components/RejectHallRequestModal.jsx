import { useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import IconButton from "../../../shared/components/ui/IconButton";

const REASON_SUGGESTIONS = [
  "بيانات ناقصة",
  "معلومات غير صحيحة",
  "الصالة مخالفة للشروط",
];

const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

export default function RejectHallRequestModal({ request, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!request) return;
    setReason("");
    setSubmitting(false);
  }, [request]);

  if (!request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !reason.trim()) return;
    setSubmitting(true);
    await onSubmit(reason.trim());
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">رفض الطلب</h2>
            <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{request.hallName}</p>
          </div>
          <IconButton icon={X} label="إغلاق" tone="muted" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-gray-500 dark:text-gray-400">سبب الرفض</label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {REASON_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReason(s)}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold text-gray-600 transition hover:border-[#6B5478] hover:text-[#6B5478] dark:border-gray-700 dark:text-gray-300"
                >
                  {s}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              placeholder="اكتب سبب الرفض — سيُرسل للمدير عبر البريد"
              className={`${inputCls} resize-none`}
            />
          </div>

          <p className="text-[10px] leading-relaxed text-gray-400">
            سيتم إرسال بريد إلى <span dir="ltr" className="font-bold text-gray-600 dark:text-gray-300">{request.managerEmail}</span> يتضمن سبب الرفض.
          </p>

          <button
            type="submit"
            disabled={submitting || !reason.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            <Send size={15} />
            {submitting ? "جاري الإرسال..." : "إرسال الرفض"}
          </button>
        </form>
      </div>
    </div>
  );
}
