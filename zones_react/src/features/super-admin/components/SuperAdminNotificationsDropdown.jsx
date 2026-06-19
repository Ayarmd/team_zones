import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, Clock, UserPlus } from "lucide-react";
import { DASHBOARD_NOTIFICATION_BTN_CLS } from "../../../shared/components/dashboardTopBarUi";
import { HALL_REQUEST_STATUS } from "../data/hallRequestStatus";
import { SUPER_ADMIN_ROUTES } from "../data/superAdminConstants";
import {
  getSuperAdminState,
  markAlertRead,
  markAllAlertsRead,
} from "../data/superAdminStorage";

function financialAlertMessage(a) {
  if (a.message) return a.message;
  if (a.type === "collected") return `تم تحصيل عمولة ${a.hallName} بقيمة ${a.amount} د.ل`;
  return `يتبقى ${a.daysLeft} يوم على استحقاق عمولة ${a.hallName} بقيمة ${a.amount} د.ل`;
}

export default function SuperAdminNotificationsDropdown({ pendingCount = 0 }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const refresh = () => {
    const state = getSuperAdminState();
    setAlerts(state.financialAlerts || []);
    setPendingRequests(
      (state.pendingRequests || []).filter((r) => r.status === HALL_REQUEST_STATUS.pending),
    );
  };

  useEffect(() => {
    refresh();
    window.addEventListener("super-admin-data-updated", refresh);
    return () => window.removeEventListener("super-admin-data-updated", refresh);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.read).length;
  const badgeCount = pendingCount + unreadAlerts;

  const close = () => setOpen(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={DASHBOARD_NOTIFICATION_BTN_CLS}
        title="الإشعارات"
        aria-label="الإشعارات"
        aria-expanded={open}
      >
        <Bell size={18} />
        {badgeCount > 0 ? (
          <span className="absolute -top-1.5 -start-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40" onClick={close} aria-label="إغلاق الإشعارات" />
          <div className="absolute left-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">الإشعارات</h3>
              {unreadAlerts > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    markAllAlertsRead();
                    refresh();
                  }}
                  className="text-[11px] font-bold text-[#6B5478]"
                >
                  تعليم الكل كمقروء
                </button>
              ) : null}
            </div>

            <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {pendingCount}
                  </span>
                  <p className="text-[11px] font-extrabold text-gray-800 dark:text-gray-100">طلبات الانضمام</p>
                </div>

                {pendingRequests.length === 0 ? (
                  <p className="py-2 text-center text-[11px] text-gray-400">لا توجد طلبات معلّقة.</p>
                ) : (
                  pendingRequests.slice(0, 5).map((req) => (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => {
                        close();
                        navigate(SUPER_ADMIN_ROUTES.pending);
                      }}
                      className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2.5 text-right transition hover:bg-[#6B5478]/5 dark:hover:bg-[#6B5478]/10"
                    >
                      <UserPlus size={15} className="mt-0.5 shrink-0 text-[#6B5478]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-extrabold text-gray-800 dark:text-gray-100">
                          {req.hallName}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                          {req.city} · {req.submittedAt?.replaceAll("-", "/")}
                        </span>
                      </span>
                    </button>
                  ))
                )}

                {pendingCount > 0 ? (
                  <Link
                    to={SUPER_ADMIN_ROUTES.pending}
                    onClick={close}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#6B5478] py-2 text-[11px] font-bold text-white transition hover:bg-[#5a4665]"
                  >
                    <UserPlus size={13} />
                    عرض طلبات الانضمام
                  </Link>
                ) : null}
              </div>

              <div className="px-4 py-3">
                <p className="mb-2 text-[11px] font-extrabold text-gray-800 dark:text-gray-100">تنبيهات مالية</p>
                {alerts.length === 0 ? (
                  <p className="py-2 text-center text-[11px] text-gray-400">لا توجد تنبيهات مالية.</p>
                ) : (
                  alerts.slice(0, 6).map((a) => {
                    const collected = a.type === "collected";
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          if (!a.read) {
                            markAlertRead(a.id);
                            refresh();
                          }
                        }}
                        className={`mb-1 flex w-full items-start gap-2.5 rounded-xl px-2 py-2.5 text-right text-[11px] leading-relaxed transition last:mb-0 ${
                          a.read
                            ? "text-gray-400"
                            : "bg-[#6B5478]/5 text-gray-700 hover:bg-[#6B5478]/10 dark:bg-[#6B5478]/10 dark:text-gray-200"
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {collected ? (
                            <CheckCircle2 size={15} className={a.read ? "text-gray-300" : "text-emerald-500"} />
                          ) : (
                            <Clock size={15} className={a.read ? "text-gray-300" : "text-amber-500"} />
                          )}
                        </span>
                        <span className="flex-1 font-semibold">{financialAlertMessage(a)}</span>
                        {!a.read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" /> : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
