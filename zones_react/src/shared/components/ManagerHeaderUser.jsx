import { MANAGER_DISPLAY_NAME } from "../config/managerProfile";

export default function ManagerHeaderUser() {
  return (
    <div className="manager-header-user">
      <span className="manager-header-user__name">{MANAGER_DISPLAY_NAME}</span>
      <div className="manager-header-user__avatar" role="img" aria-label="صورة المدير" />
    </div>
  );
}
