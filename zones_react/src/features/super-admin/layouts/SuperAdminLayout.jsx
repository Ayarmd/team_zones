import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import SuperAdminTopBar from "../components/SuperAdminTopBar";
import MaintenanceModeBanner from "../components/MaintenanceModeBanner";
import { getSuperAdminSession } from "../data/superAdminAuth";
import { getPendingRequestsCount } from "../data/superAdminStorage";

export default function SuperAdminLayout() {
  const location = useLocation();
  const session = getSuperAdminSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(getPendingRequestsCount());

  const refreshCounts = () => {
    setPendingCount(getPendingRequestsCount());
  };

  useEffect(() => {
    refreshCounts();
    const handler = () => refreshCounts();
    window.addEventListener("super-admin-data-updated", handler);
    return () => window.removeEventListener("super-admin-data-updated", handler);
  }, [location.pathname]);

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
        <SuperAdminSidebar pendingCount={pendingCount} onNavigate={() => setSidebarOpen(false)} />
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
        <SuperAdminTopBar
          session={session}
          pendingCount={pendingCount}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <MaintenanceModeBanner />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
