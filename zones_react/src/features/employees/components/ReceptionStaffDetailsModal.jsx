import AdminModal from "../../devices-packages/components/AdminModal";
import {
  accountStatusLabel,
  formatDateAr,
  formatSalary,
  roleLabel,
  shiftLabel,
  statusLabel,
  workDaysLabel,
} from "../data/employeeMeta";

function DetailRow({ label, value, ltr = false }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 text-xs dark:border-gray-800">
      <span className="shrink-0 font-semibold text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-end font-bold text-gray-800 dark:text-gray-100 ${ltr ? "dir-ltr" : ""}`}>{value || "—"}</span>
    </div>
  );
}

export default function ReceptionStaffDetailsModal({ open, employee, onClose }) {
  if (!employee) return null;

  return (
    <AdminModal open={open} onClose={onClose} title="تفاصيل الموظف" wide>
      <div className="mt-4 space-y-5" dir="rtl">
        <div className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <img
            src={employee.photoUrl}
            alt={employee.fullName}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-[#6B5478]/30"
          />
          <div>
            <h4 className="text-base font-extrabold text-gray-900 dark:text-white">{employee.fullName}</h4>
            <p className="text-xs text-gray-500">{roleLabel(employee.role)}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-extrabold text-gray-700 dark:text-gray-200">البيانات الشخصية</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <DetailRow label="البريد الإلكتروني" value={employee.email} ltr />
            <DetailRow label="رقم الهاتف" value={employee.phone} ltr />
            <DetailRow label="تاريخ الانضمام" value={formatDateAr(employee.joinDate)} />
            <DetailRow label="حالة الحساب" value={accountStatusLabel(employee.accountStatus)} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-extrabold text-gray-700 dark:text-gray-200">معلومات العمل</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <DetailRow label="نوع الموظف" value={roleLabel(employee.role)} />
            <DetailRow label="اسم الصالة المرتبط بها" value={employee.hallName} />
            <DetailRow label="نوع الدوام" value={shiftLabel(employee.shift)} />
            <DetailRow label="أيام العمل" value={workDaysLabel(employee.workDays)} />
            <DetailRow label="الراتب الشهري" value={formatSalary(employee.salary)} />
            <DetailRow label="الحالة" value={statusLabel(employee.status)} />
          </div>
        </div>

        {employee.notes ? (
          <div>
            <p className="mb-2 text-xs font-extrabold text-gray-700 dark:text-gray-200">الملاحظات</p>
            <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-200">
              {employee.notes}
            </p>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 dark:border-gray-700 dark:text-gray-300"
          >
            إغلاق
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
