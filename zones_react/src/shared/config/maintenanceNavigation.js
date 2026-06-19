import { MAINTENANCE_EMPLOYEE_ROUTES } from "../../features/employees/data/maintenanceEmployeeRoutes";

export const maintenanceSidebarItems = [
  { label: "لوحة التحكم", path: MAINTENANCE_EMPLOYEE_ROUTES.dashboard, enabled: true, end: true },
  { label: "الأعطال", path: MAINTENANCE_EMPLOYEE_ROUTES.faults, enabled: true, end: true, badgeKey: "pending" },
  { label: "السجل", path: MAINTENANCE_EMPLOYEE_ROUTES.faultsArchive, enabled: true, end: true },
  { label: "الملف الشخصي", path: MAINTENANCE_EMPLOYEE_ROUTES.profile, enabled: true, end: true },
  { label: "تغيير كلمة المرور", path: MAINTENANCE_EMPLOYEE_ROUTES.changePassword, enabled: true, end: true },
];
