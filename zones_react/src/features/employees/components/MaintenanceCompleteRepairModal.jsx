import { useEffect, useState } from "react";
import AdminModal from "../../devices-packages/components/AdminModal";
import Button from "../../super-admin/components/ui/Button";
import DeviceNameCell from "./DeviceNameCell";

const labelCls = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

export default function MaintenanceCompleteRepairModal({ open, device, onClose, onConfirm }) {
  const [cost, setCost] = useState("");

  useEffect(() => {
    if (open) setCost("");
  }, [open, device?.id]);

  if (!device) return null;

  const submit = (e) => {
    e.preventDefault();
    onConfirm?.(Number(cost) || 0);
  };

  return (
    <AdminModal open={open} onClose={onClose} title="تم الإصلاح" wide>
      <form onSubmit={submit} className="mt-4 space-y-4" dir="rtl">
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/40">
          <p className={labelCls}>الجهاز</p>
          <DeviceNameCell device={device} />
        </div>

        <div>
          <label htmlFor="repair-cost" className={labelCls}>
            تكلفة الإصلاح (د.ل) <span className="text-red-500">*</span>
          </label>
          <input
            id="repair-cost"
            type="number"
            min="0"
            step="1"
            required
            dir="ltr"
            className={inputCls}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0"
          />
          <p className="mt-1 text-[10px] text-gray-400">تُحفظ في سجل الصيانة والأرشيف لمراجعة المدير.</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" size="sm">
            تأكيد الإصلاح والأرشفة
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
