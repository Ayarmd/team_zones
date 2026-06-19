import { useEffect, useState } from "react";
import AdminModal from "../../devices-packages/components/AdminModal";
import { workDaysLabel } from "../data/employeeMeta";
import RoleToggleGroup from "./RoleToggleGroup";
import ShiftToggleGroup from "./ShiftToggleGroup";
import StatusToggleGroup from "./StatusToggleGroup";
import WorkDaysToggleGroup from "./WorkDaysToggleGroup";
import { FormFieldLabel, FormSectionTag } from "./employeeFormUi";
import { saveEmployees } from "../data/employeesStorage";
import { confirmAction, toastSuccess } from "../utils/employeeConfirm";

const inputCls =
  "w-full rounded-xl border border-gray-200/90 bg-gray-50/90 px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-white/10 dark:bg-gray-950/60 dark:text-gray-100";
const readOnlyCls =
  "w-full rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 text-xs font-semibold text-gray-600 dark:border-white/10 dark:bg-gray-950/40 dark:text-gray-300";

function ReadOnlyField({ label, value, ltr = false }) {
  return (
    <div>
      <FormFieldLabel>{label}</FormFieldLabel>
      <div className={readOnlyCls} dir={ltr ? "ltr" : undefined}>
        {value || "—"}
      </div>
    </div>
  );
}

const MANAGER_FIELDS = ["role", "shift", "workDays", "status", "salary", "notes"];

export default function ReceptionStaffEditModal({ open, employee, employees, onClose, onSaved }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!employee) return;
    setForm({
      role: employee.role,
      shift: employee.shift,
      workDays: employee.workDays ?? "",
      status: employee.status,
      salary: employee.salary ?? "",
      notes: employee.notes ?? "",
    });
  }, [employee]);

  if (!employee || !form) return null;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const ok = await confirmAction({
      title: "حفظ التعديلات؟",
      text: `سيتم تحديث الوظيفة والدوام والحالة والراتب والملاحظات لـ «${employee.fullName}».`,
      confirmText: "نعم، احفظ",
    });
    if (!ok) return;

    const patch = Object.fromEntries(MANAGER_FIELDS.map((k) => [k, form[k]]));
    const next = employees.map((e) => (e.id === employee.id ? { ...e, ...patch } : e));
    saveEmployees(next);
    onSaved(next);
    await toastSuccess("تم الحفظ", "تم تحديث بيانات الموظف.");
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        إلغاء
      </button>
      <button
        type="button"
        onClick={handleSave}
        className="rounded-xl bg-[#6B5478] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#6B5478]/30 transition hover:opacity-90"
      >
        حفظ
      </button>
    </div>
  );

  return (
    <AdminModal open={open} onClose={onClose} title="تعديل الموظف" wide stickyLayout footer={footer}>
      <div className="space-y-5" dir="rtl">
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-white/10 dark:bg-gray-950/40">
          <img
            src={employee.photoUrl}
            alt={employee.fullName}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-[#6B5478]/25"
          />
          <div>
            <p className="text-sm font-extrabold text-gray-900 dark:text-white">{employee.fullName}</p>
            <p className="text-[11px] text-gray-500">{employee.email}</p>
          </div>
        </div>

        <section>
          <FormSectionTag>بيانات الموظف — للقراءة فقط</FormSectionTag>
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="البريد الإلكتروني" value={employee.email} ltr />
            <ReadOnlyField label="رقم الهاتف" value={employee.phone} ltr />
            <ReadOnlyField label="اسم الصالة" value={employee.hallName} />
          </div>
        </section>

        <section>
          <FormSectionTag editable>ما يمكن للمدير تعديله</FormSectionTag>
          <div className="space-y-4">
            <div>
              <FormFieldLabel>نوع الوظيفة</FormFieldLabel>
              <RoleToggleGroup value={form.role} onChange={(v) => set("role", v)} />
            </div>

            <div>
              <FormFieldLabel>نوع الدوام</FormFieldLabel>
              <ShiftToggleGroup value={form.shift} onChange={(v) => set("shift", v)} />
            </div>

            <div>
              <FormFieldLabel>أيام العمل</FormFieldLabel>
              <WorkDaysToggleGroup value={form.workDays} onChange={(v) => set("workDays", v)} />
              <p className="mt-2 text-[10px] font-semibold text-gray-400">
                المختار: {workDaysLabel(form.workDays)}
              </p>
            </div>

            <div>
              <FormFieldLabel>الحالة</FormFieldLabel>
              <StatusToggleGroup value={form.status} onChange={(v) => set("status", v)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FormFieldLabel htmlFor="edit-salary">الراتب الشهري</FormFieldLabel>
                <input
                  id="edit-salary"
                  type="number"
                  className={inputCls}
                  value={form.salary}
                  onChange={(e) => set("salary", e.target.value)}
                />
              </div>
              <div>
                <FormFieldLabel htmlFor="edit-notes">الملاحظات</FormFieldLabel>
                <textarea
                  id="edit-notes"
                  rows={2}
                  className={`${inputCls} min-h-[38px] resize-none`}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="ملاحظات المدير عن الموظف..."
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminModal>
  );
}
