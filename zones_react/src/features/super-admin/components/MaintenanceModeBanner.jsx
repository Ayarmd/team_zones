import { AlertTriangle, ShieldCheck } from "lucide-react";
import { isMaintenanceModeEnabled } from "../data/maintenanceModeData";
import { getSuperAdminState } from "../data/superAdminStorage";

export default function MaintenanceModeBanner() {
  if (!isMaintenanceModeEnabled()) return null;

  const activatedAt = getSuperAdminState().systemSettings?.maintenanceActivatedAt;
  const notified = getSuperAdminState().systemSettings?.maintenanceNotificationsCount || 0;

  return (
    <div className="border-b border-amber-500/30 bg-gradient-to-l from-amber-500/15 via-amber-400/10 to-transparent px-4 py-2.5 dark:from-amber-500/10">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={16} />
          </span>
          <div className="text-right">
            <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
              وضع الصيانة مفعّل — أنت الوحيد الذي يملك وصولاً كاملاً للوحة التحكم
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-amber-700/80 dark:text-amber-400/90">
              الزبائن وموظفو الاستقبال معطّلون. الحجوزات السابقة محفوظة ولم تُحذف.
              {notified > 0 ? ` · تم إشعار ${notified} زبون.` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 dark:text-amber-400">
          <ShieldCheck size={14} />
          {activatedAt ? (
            <span dir="ltr">منذ {new Date(activatedAt).toLocaleString("ar-LY")}</span>
          ) : (
            <span>نشط الآن</span>
          )}
        </div>
      </div>
    </div>
  );
}
