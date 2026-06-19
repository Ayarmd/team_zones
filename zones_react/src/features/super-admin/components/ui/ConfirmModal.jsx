import { X } from "lucide-react";
import IconButton from "../../../../shared/components/ui/IconButton";

export default function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{title}</h3>
          <IconButton icon={X} label="إغلاق" tone="muted" onClick={onCancel} />
        </div>
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-[#6B5478] hover:bg-[#5a4668]"
            }`}
          >
            {confirmLabel || "تأكيد"}
          </button>
        </div>
      </div>
    </div>
  );
}
