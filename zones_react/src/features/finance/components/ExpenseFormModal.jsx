import { useEffect, useState } from "react";
import AdminModal from "../../devices-packages/components/AdminModal";
import { Select, alertFormFieldCls, alertFormTextareaCls } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Button from "../../super-admin/components/ui/Button";

const paymentOptions = [
  { value: "paid", label: "مدفوع" },
  { value: "unpaid", label: "غير مدفوع" },
];

const EMPTY = {
  name: "",
  amount: "",
  isPaid: true,
  addedAt: "",
  paidAt: "",
  notes: "",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseFormModal({ open, mode = "add", expense, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && expense) {
      setForm({
        name: expense.name || "",
        amount: String(expense.amount ?? ""),
        isPaid: expense.isPaid !== false,
        addedAt: expense.addedAt || todayIso(),
        paidAt: expense.paidAt || "",
        notes: expense.notes || "",
      });
    } else {
      setForm({ ...EMPTY, addedAt: todayIso(), paidAt: todayIso() });
    }
  }, [open, mode, expense]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const amount = Number(String(form.amount).replace(/[^\d.]/g, "")) || 0;
    if (!name || amount <= 0) return;
    onSave?.({
      name,
      amount,
      isPaid: form.isPaid,
      addedAt: form.addedAt,
      paidAt: form.isPaid ? form.paidAt || form.addedAt : "",
      notes: form.notes.trim(),
    });
  };

  const title = mode === "edit" ? "تعديل مصروف" : "إضافة مصروف";

  return (
    <AdminModal open={open} onClose={onClose} title={title} wide>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" dir="rtl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="ex-name" className="mb-1.5 block text-[10px] font-bold text-gray-400">
              اسم المصروف <span className="text-red-500">*</span>
            </Label>
            <input
              id="ex-name"
              type="text"
              className={alertFormFieldCls}
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="مثال: إيجار مكان، صيانة جهاز..."
            />
          </div>

          <div>
            <Label htmlFor="ex-amount" className="mb-1.5 block text-[10px] font-bold text-gray-400">
              المبلغ <span className="text-red-500">*</span>
            </Label>
            <input
              id="ex-amount"
              type="number"
              min={1}
              className={alertFormFieldCls}
              required
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[10px] font-bold text-gray-400">
              حالة الدفع <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.isPaid ? "paid" : "unpaid"}
              onValueChange={(v) => set("isPaid", v === "paid")}
              options={paymentOptions}
            />
          </div>

          <div>
            <Label htmlFor="ex-added" className="mb-1.5 block text-[10px] font-bold text-gray-400">
              تاريخ الإضافة <span className="text-red-500">*</span>
            </Label>
            <input
              id="ex-added"
              type="date"
              className={alertFormFieldCls}
              required
              value={form.addedAt}
              onChange={(e) => set("addedAt", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="ex-paid-date" className="mb-1.5 block text-[10px] font-bold text-gray-400">
              تاريخ إعطاء المبلغ
            </Label>
            <input
              id="ex-paid-date"
              type="date"
              className={`${alertFormFieldCls} disabled:cursor-not-allowed disabled:opacity-50`}
              value={form.paidAt}
              disabled={!form.isPaid}
              onChange={(e) => set("paidAt", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="ex-notes" className="mb-1.5 block text-[10px] font-bold text-gray-400">
            ملاحظات
          </Label>
          <textarea
            id="ex-notes"
            rows={3}
            className={alertFormTextareaCls}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="ملاحظات إضافية عن المصروف..."
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" size="sm">
            {mode === "edit" ? "حفظ التعديل" : "حفظ المصروف"}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
