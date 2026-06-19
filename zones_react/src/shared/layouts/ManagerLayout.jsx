import { useState } from "react";
import ManagerSidebar from "../components/ManagerSidebar";
import ManagerTopBar from "../components/ManagerTopBar";
import useActiveSessionGuard from "../hooks/useActiveSessionGuard";

export default function ManagerLayout({ children, title, description }) {
  useActiveSessionGuard();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <ManagerSidebar onNavigate={() => setSidebarOpen(false)} />
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
        <ManagerTopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          {title ? (
            <div className="mb-5">
              <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">{title}</h1>
              {description ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
              ) : null}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
