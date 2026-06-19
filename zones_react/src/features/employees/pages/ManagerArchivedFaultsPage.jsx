import PageHeader from "../../super-admin/components/ui/PageHeader";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import MaintenanceFaultsTableSection from "../components/MaintenanceFaultsTableSection";

export default function ManagerArchivedFaultsPage() {
  return (
    <ManagerLayout>
      <div className="space-y-4" dir="rtl">
        <PageHeader
          title="الأعطال المؤرشفة"
          description="عرض الأعطال التي أرشفها موظفو الصيانة — مرتبطة مباشرة مع لوحة الصيانة."
        />
        <MaintenanceFaultsTableSection
          mode="archived"
          readOnly
          showEmployeeColumn
          sectionTitle="الأرشيف"
        />
      </div>
    </ManagerLayout>
  );
}
