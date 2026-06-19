import PageHeader from "../../super-admin/components/ui/PageHeader";
import MaintenanceFaultsTableSection from "../components/MaintenanceFaultsTableSection";

export default function MaintenanceFaultsPage() {
  return (
    <div className="space-y-4" dir="rtl">
      <PageHeader title="الأعطال" />
      <MaintenanceFaultsTableSection mode="active" sectionTitle="الأعطال النشطة" />
    </div>
  );
}
