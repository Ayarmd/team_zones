import PageHeader from "../../super-admin/components/ui/PageHeader";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import MaintenanceFaultsTableSection from "../components/MaintenanceFaultsTableSection";

export default function ManagerFaultsPage() {
  return (
    <ManagerLayout>
      <div className="space-y-4" dir="rtl">
        <PageHeader
          title="الأعطال"
          description="عرض سجلات الأعطال النشطة — مرتبطة مباشرة مع لوحة موظف الصيانة وتحدّث فوراً."
        />
        <MaintenanceFaultsTableSection
          mode="active"
          readOnly
          showEmployeeColumn
          sectionTitle="الأعطال"
        />
      </div>
    </ManagerLayout>
  );
}
