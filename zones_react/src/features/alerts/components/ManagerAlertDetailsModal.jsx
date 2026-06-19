import AdminModal from "../../devices-packages/components/AdminModal";
import Button from "../../super-admin/components/ui/Button";
import {
  alertSeverityLabel,
  alertSeverityMeta,
  alertStatusLabel,
  alertTargetLabel,
  formatAlertRecordCode,
} from "../data/alertsMeta";

function DetailRow({ label, value, dir, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-800/40">
      <p className="text-[10px] font-bold text-gray-400">{label}</p>
      {children ?? (
        <p className="mt-1 text-xs font-bold text-gray-800 dark:text-gray-100" dir={dir}>
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function TextBlock({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-800/40">
      <p className="text-[10px] font-bold text-gray-400">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
        {value || "—"}
      </p>
    </div>
  );
}

export default function ManagerAlertDetailsModal({ open, alert, onClose }) {
  if (!alert) return null;

  const active = alert.status === "active";
  const severity = alertSeverityMeta(alert.severity);

  return (
    <AdminModal open={open} onClose={onClose} title="تفاصيل التنبيه" wide>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailRow label="رقم السجل" value={formatAlertRecordCode(alert.id)} dir="ltr" />
        <DetailRow label="اسم التنبيه" value={alert.name} />
        <DetailRow
          label="فئة مستهدفة"
          value={alertTargetLabel(alert.targetCategories ?? alert.targetCategory)}
        />
        <DetailRow label="مستوى الخطورة">
          <span
            className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${severity.badgeClass}`}
          >
            {alertSeverityLabel(alert.severity)}
          </span>
        </DetailRow>
        <DetailRow label="الحالة" value={alertStatusLabel(alert.status)} />
        <DetailRow label="تاريخ البداية" value={alert.startDate} dir="ltr" />
        <DetailRow label="تاريخ النهاية" value={alert.endDate || "—"} dir="ltr" />
      </div>

      <div className="mt-3 space-y-3">
        <TextBlock label="وصف للحالة" value={alert.situationDescription} />
        <TextBlock label="إجراء بديل أو تعليمات" value={alert.alternativeInstructions} />
      </div>

      {active ? (
        <p className="mt-3 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          التنبيه نشط — سيُسجَّل تاريخ النهاية تلقائياً عند إيقافه.
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          إغلاق
        </Button>
      </div>
    </AdminModal>
  );
}
