import { Link } from "react-router-dom";
import { AlertTriangle, Menu } from "lucide-react";
import DashboardProfileChip from "../../../shared/components/DashboardProfileChip";
import DashboardTopBarActions from "../../../shared/components/DashboardTopBarActions";
import { DASHBOARD_ICON_BTN_CLS } from "../../../shared/components/dashboardTopBarUi";
import { isMaintenanceModeEnabled } from "../data/maintenanceModeData";
import { SUPER_ADMIN_ROUTES } from "../data/superAdminConstants";
import SuperAdminNotificationsDropdown from "./SuperAdminNotificationsDropdown";

export default function SuperAdminTopBar({ session, pendingCount = 0, onMenuClick }) {
  const maintenanceActive = isMaintenanceModeEnabled();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`${DASHBOARD_ICON_BTN_CLS} lg:hidden`}
          onClick={onMenuClick}
          aria-label="فتح القائمة"
        >
          <Menu size={18} />
        </button>
        <p className="hidden text-xs font-bold text-gray-500 sm:block dark:text-gray-400">
          مرحباً، {session?.fullName || "مدير النظام"}
        </p>
      </div>

      <DashboardTopBarActions
        profile={<DashboardProfileChip superAdmin roleLabel="مدير النظام" />}
        notifications={
          <>
            {maintenanceActive ? (
              <Link
                to={SUPER_ADMIN_ROUTES.settings}
                className="hidden items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-[10px] font-extrabold text-amber-700 transition hover:bg-amber-500/20 dark:text-amber-400 sm:inline-flex"
                title="وضع الصيانة مفعّل"
              >
                <AlertTriangle size={13} />
                وضع الصيانة
              </Link>
            ) : null}
            <SuperAdminNotificationsDropdown pendingCount={pendingCount} />
          </>
        }
      />
    </header>
  );
}
