import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import UsersTable from "../components/UsersTable";
import { getSuperAdminState } from "../data/superAdminStorage";

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "reception", label: "الاستقبال" },
  { key: "maintenance", label: "الصيانة" },
];

export default function EmployeesManagementPage() {
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const refresh = () => setEmployees(getSuperAdminState().employees);
    refresh();
    window.addEventListener("super-admin-data-updated", refresh);
    return () => window.removeEventListener("super-admin-data-updated", refresh);
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? employees : employees.filter((e) => e.role === filter)),
    [employees, filter],
  );

  return (
    <div>
      <PageHeader title="الموظفون" />

      <UsersTable
        collection="employees"
        users={filtered}
        searchPlaceholder="ابحث عن موظف..."
      />

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
              filter === f.key
                ? "bg-[#6B5478] text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
