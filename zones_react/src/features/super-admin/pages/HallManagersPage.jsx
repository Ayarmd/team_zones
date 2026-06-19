import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import UsersTable from "../components/UsersTable";
import { getSuperAdminState } from "../data/superAdminStorage";

export default function HallManagersPage() {
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    const refresh = () => setManagers(getSuperAdminState().managers);
    refresh();
    window.addEventListener("super-admin-data-updated", refresh);
    return () => window.removeEventListener("super-admin-data-updated", refresh);
  }, []);

  return (
    <div>
      <PageHeader title="مدراء الصالات" />

      <UsersTable
        collection="managers"
        users={managers}
        isManager
        searchPlaceholder="ابحث عن مدير صالة..."
      />
    </div>
  );
}
