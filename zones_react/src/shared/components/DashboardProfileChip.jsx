import { User } from "lucide-react";
import { useDashboardProfile } from "../hooks/useDashboardProfile";
import { DASHBOARD_PROFILE_CHIP_CLS } from "./dashboardTopBarUi";

export default function DashboardProfileChip({ roleLabel, superAdmin = false }) {
  const profile = useDashboardProfile({ superAdmin });
  const displayName = profile.fullName || roleLabel;
  const avatar = profile.avatar;

  return (
    <div className={DASHBOARD_PROFILE_CHIP_CLS} aria-label="الملف الشخصي">
      {avatar ? (
        <img
          src={avatar}
          alt={displayName}
          className="h-9 w-9 shrink-0 rounded-lg object-cover ring-2 ring-[#6B5478]/30"
        />
      ) : (
        <User size={20} className="shrink-0 text-[#6B5478] dark:text-[#c4b5d0]" />
      )}
      <div className="min-w-0 text-left">
        <p className="truncate text-xs font-extrabold text-gray-900 dark:text-white">
          {displayName}
        </p>
        <p className="truncate text-[10px] font-semibold text-[#6B5478] dark:text-[#c4a8d4]">
          {roleLabel}
        </p>
      </div>
    </div>
  );
}
