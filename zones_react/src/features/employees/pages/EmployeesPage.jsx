import { Navigate, useSearchParams } from "react-router-dom";
import MaintenanceEmployeesPage from "./MaintenanceEmployeesPage";

/** توافق مع الرابط القديم ?view=archive */
export default function EmployeesPage() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("view") === "archive") {
    return <Navigate to="/employees/archive" replace />;
  }
  return <MaintenanceEmployeesPage />;
}
