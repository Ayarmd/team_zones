import { faultStatusLabel, faultTypeLabel, formatDisplayDate } from "../data/faultMeta";
import MaintenanceGlassModal from "./MaintenanceGlassModal";

function DetailField({ label, value }) {
  return (
    <div className="maint-detail-field">
      <span className="maint-detail-field__label">{label}</span>
      <span className="maint-detail-field__value">{value ?? "—"}</span>
    </div>
  );
}

export default function FaultDetailsModal({ fault, isOpen, onClose }) {
  if (!fault) return null;

  const footer = (
    <button type="button" className="primary-btn maint-modal__btn" onClick={onClose}>
      إغلاق
    </button>
  );

  return (
    <MaintenanceGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="تفاصيل العطل"
      wide
      noScroll
      footer={footer}
    >
      <div className="maint-detail-grid">
        <DetailField label="رقم العطل" value={fault.id} />
        <DetailField label="الجهاز" value={fault.deviceName} />
        <DetailField label="نوع العطل" value={faultTypeLabel(fault.faultType, fault.faultTypeCustom)} />
        <DetailField label="الحالة" value={faultStatusLabel(fault.status)} />
        <DetailField label="تاريخ الإنشاء" value={formatDisplayDate(fault.createdAt)} />
        <DetailField
          label="تكلفة الصيانة"
          value={fault.maintenanceCost ? `${fault.maintenanceCost} د.ل` : "—"}
        />
        <DetailField label="اسم موظف الصيانة" value={fault.maintenanceEmployeeName} />
        <div className="maint-detail-field maint-detail-field--wide">
          <span className="maint-detail-field__label">تفاصيل العطل</span>
          <span className="maint-detail-field__value">{fault.details || "—"}</span>
        </div>
      </div>
    </MaintenanceGlassModal>
  );
}
