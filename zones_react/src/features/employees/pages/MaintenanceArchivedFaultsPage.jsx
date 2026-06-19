import PageHeader from "../../super-admin/components/ui/PageHeader";
import MaintenanceFaultsTableSection from "../components/MaintenanceFaultsTableSection";

export default function MaintenanceArchivedFaultsPage() {
  return (
    <div className="space-y-4" dir="rtl">
      <PageHeader title="السجل" />
      <MaintenanceFaultsTableSection mode="archived" sectionTitle="سجل الإصلاحات" />
    </div>
  );
}
