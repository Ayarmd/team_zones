import { getAuthSession, getUserById } from "../../auth/data/mockUsersStorage";
import { loadEmployees } from "../data/employeesStorage";
import { loadManagerHall } from "../../lounge/data/managerHallStorage";

/** سجل الموظف في الجدول — بالربط employeeId فقط (للبيانات الوظيفية للقراءة) */
export function getLinkedEmployeeRecord(user) {
  if (!user?.employeeId) return null;
  return loadEmployees().find((e) => e.id === user.employeeId && e.role === "maintenance") ?? null;
}

export function getMaintenanceProfileBundle() {
  const session = getAuthSession();
  const user = session?.id ? getUserById(session.id) : null;
  const employee = getLinkedEmployeeRecord(user);
  const hall = loadManagerHall();

  return {
    session,
    user,
    employee,
    hallName: hall?.hallName || "—",
  };
}
