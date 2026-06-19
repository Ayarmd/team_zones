import ThemePill from "./ThemePill";
import { DASHBOARD_TOPBAR_ACTIONS_CLS } from "./dashboardTopBarUi";

/** يسار → يمين: ملف شخص | تنبيه | مود */
export default function DashboardTopBarActions({ profile, notifications }) {
  return (
    <div className={DASHBOARD_TOPBAR_ACTIONS_CLS} dir="ltr">
      {profile}
      {notifications}
      <ThemePill />
    </div>
  );
}
