import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { alertSeverityMeta } from "../../alerts/data/alertsMeta";
import {
  getNotificationsForAudience,
  HALL_NOTIFICATIONS_EVENT,
} from "../../alerts/data/hallNotificationsStorage";

export default function CustomerAlertBanner() {
  const [items, setItems] = useState(() => getNotificationsForAudience("customer"));

  const refresh = useCallback(() => {
    setItems(getNotificationsForAudience("customer"));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(HALL_NOTIFICATIONS_EVENT, refresh);
    return () => window.removeEventListener(HALL_NOTIFICATIONS_EVENT, refresh);
  }, [refresh]);

  if (!items.length) return null;

  return (
    <div className="mt-4 space-y-2">
      {items.slice(0, 3).map((row) => {
        const severity = row.type === "manager_alert" ? alertSeverityMeta(row.severity) : null;
        return (
          <div
            key={row.id}
            className="rounded-2xl border border-[#6B5478]/20 bg-[#6B5478]/8 p-3 dark:border-[#6B5478]/30 dark:bg-[#6B5478]/12"
          >
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B5478]">
              <Bell size={12} />
              {severity ? `تنبيه من الصالة — ${severity.label}` : "تنبيه من الصالة"}
            </p>
            <p className="mt-1.5 text-xs font-semibold leading-relaxed text-gray-800 dark:text-gray-100">
              {row.message}
            </p>
            {row.instructions ? (
              <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">{row.instructions}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
