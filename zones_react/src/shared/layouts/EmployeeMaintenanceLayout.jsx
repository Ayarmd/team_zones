import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import MaintenanceEmployeeSidebar from "../../features/employees/components/MaintenanceEmployeeSidebar";
import MaintenanceEmployeeTopBar from "../../features/employees/components/MaintenanceEmployeeTopBar";
import { getMaintenancePendingBadgeCount } from "../../features/employees/data/maintenanceDashboardData";
import { getAuthSession } from "../../features/auth/data/mockUsersStorage";
import { DEVICES_STORAGE_EVENT } from "../../features/devices-packages/data/devicesStorage";
import { MAINTENANCE_FAULTS_EVENT } from "../../features/maintenance/data/maintenanceFaultsStorage";
import useActiveSessionGuard from "../hooks/useActiveSessionGuard";

export default function EmployeeMaintenanceLayout() {
  useActiveSessionGuard();
  const session = getAuthSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(getMaintenancePendingBadgeCount);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getMaintenancePendingBadgeCount());
  }, []);

  useEffect(() => {
    refreshPendingCount();
    window.addEventListener(MAINTENANCE_FAULTS_EVENT, refreshPendingCount);
    window.addEventListener(DEVICES_STORAGE_EVENT, refreshPendingCount);
    window.addEventListener("focus", refreshPendingCount);
    return () => {
      window.removeEventListener(MAINTENANCE_FAULTS_EVENT, refreshPendingCount);
      window.removeEventListener(DEVICES_STORAGE_EVENT, refreshPendingCount);
      window.removeEventListener("focus", refreshPendingCount);
    };
  }, [refreshPendingCount]);

  return (
    <div
      className="flex min-h-screen bg-gray-50 text-xs dark:bg-[#0b1020]"
      style={{ fontFamily: "Cairo, 'Segoe UI', Tahoma, sans-serif" }}
      dir="rtl"
    >
      <div
        className={`fixed inset-y-0 end-0 z-50 transform transition lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <MaintenanceEmployeeSidebar
          pendingCount={pendingCount}
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="إغلاق القائمة"
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <MaintenanceEmployeeTopBar session={session} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
