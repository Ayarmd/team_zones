import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { alertSeverityMeta } from "../../alerts/data/alertsMeta";
import {
  getNotificationsForAudience,
  HALL_NOTIFICATIONS_EVENT,
} from "../../alerts/data/hallNotificationsStorage";
import { BOOKINGS_STOP_EVENT } from "../../alerts/data/bookingsStopStorage";
import { DASHBOARD_NOTIFICATION_BTN_CLS } from "../../../shared/components/dashboardTopBarUi";

export default function HallNotificationsBell({ audience = "reception" }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(() => getNotificationsForAudience(audience));

  const refresh = useCallback(() => {
    setItems(getNotificationsForAudience(audience));
  }, [audience]);

  useEffect(() => {
    refresh();
    window.addEventListener(HALL_NOTIFICATIONS_EVENT, refresh);
    window.addEventListener(BOOKINGS_STOP_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(HALL_NOTIFICATIONS_EVENT, refresh);
      window.removeEventListener(BOOKINGS_STOP_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const unreadCount = useMemo(() => items.length, [items]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={DASHBOARD_NOTIFICATION_BTN_CLS}
        title="الإشعارات"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -start-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute start-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
            <p className="text-xs font-extrabold text-gray-900 dark:text-white">الإشعارات</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[11px] text-gray-400">لا توجد إشعارات.</p>
            ) : (
              items.map((row) => {
                const severity = row.type === "manager_alert" ? alertSeverityMeta(row.severity) : null;
                return (
                  <div
                    key={row.id}
                    className={`border-b border-gray-50 px-3 py-2.5 last:border-0 dark:border-gray-800 ${
                      row.type === "bookings_stop"
                        ? "bg-red-50/60 dark:bg-red-950/20"
                        : row.type === "manager_alert"
                          ? "bg-[#6B5478]/5 dark:bg-[#6B5478]/10"
                          : "bg-emerald-50/50 dark:bg-emerald-950/15"
                    }`}
                  >
                    {severity ? (
                      <span
                        className={`mb-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${severity.badgeClass}`}
                      >
                        تنبيه مدير — {severity.label}
                      </span>
                    ) : null}
                    <p className="text-[11px] leading-relaxed font-semibold text-gray-800 dark:text-gray-100">
                      {row.message}
                    </p>
                    {row.instructions ? (
                      <p className="mt-1 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                        {row.instructions}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-gray-400" dir="ltr">
                      {row.createdAt}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
