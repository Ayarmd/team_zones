import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { zonesClose } from "../utils/zonesAlerts";
import ReceptionEmployeeSidebar from "../../features/employees/components/ReceptionEmployeeSidebar";
import ReceptionEmployeeTopBar from "../../features/employees/components/ReceptionEmployeeTopBar";
import { getAuthSession } from "../../features/auth/data/mockUsersStorage";
import useActiveSessionGuard from "../hooks/useActiveSessionGuard";

/** إزالة طبقات SweetAlert العالقة التي قد تمنع النقر على الأزرار */
function clearBlockingOverlays() {
  zonesClose();
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.classList.remove("swal2-shown", "swal2-height-auto");
}

export default function EmployeeReceptionLayout() {
  useActiveSessionGuard();
  const session = getAuthSession();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    clearBlockingOverlays();
    window.scrollTo(0, 0);
  }, [location.pathname, location.search, location.key]);

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
        <ReceptionEmployeeSidebar onNavigate={() => setSidebarOpen(false)} />
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
        <ReceptionEmployeeTopBar session={session} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet key={`${location.pathname}${location.search}${location.key}`} />
        </main>
      </div>
    </div>
  );
}

