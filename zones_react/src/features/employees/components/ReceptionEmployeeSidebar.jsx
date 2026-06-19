import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarClock,
  ChevronDown,
  Home,
  LogOut,
  Monitor,
  Package,
  Tag,
  Trophy,
  User,
} from "lucide-react";
import { zonesConfirm } from "../../../shared/utils/zonesAlerts";
import { ZONES_LOGO_SRC } from "../../super-admin/data/superAdminDashboardData";
import { clearAuthSession } from "../../auth/data/mockUsersStorage";
import { RECEPTION_EMPLOYEE_ROUTES } from "../data/receptionEmployeeRoutes";

const ACCOUNT_GROUP = {
  id: "account",
  label: "حسابي",
  icon: User,
  children: [
    { label: "الملف الشخصي", path: RECEPTION_EMPLOYEE_ROUTES.profile },
    { label: "تغيير كلمة المرور", path: RECEPTION_EMPLOYEE_ROUTES.changePassword },
    { label: "تسجيل الخروج", action: "logout" },
  ],
};

const DEVICES_GROUP = {
  id: "devices",
  label: "أجهزة",
  icon: Monitor,
  children: [
    { label: "جميع الأجهزة", path: RECEPTION_EMPLOYEE_ROUTES.devices },
    { label: "الأجهزة المعطلة", path: RECEPTION_EMPLOYEE_ROUTES.devicesBroken },
  ],
};

const RESERVATIONS_GROUP = {
  id: "reservations",
  label: "حجوزات والجلسات",
  icon: CalendarClock,
  children: [
    { label: "تقويم", path: RECEPTION_EMPLOYEE_ROUTES.reservationsCalendar },
    { label: "حجوزات", path: RECEPTION_EMPLOYEE_ROUTES.reservationsBookings },
    { label: "جلسة", path: RECEPTION_EMPLOYEE_ROUTES.reservationsSession },
    { label: "محظور", path: RECEPTION_EMPLOYEE_ROUTES.reservationsBanned },
  ],
};

const TOURNAMENTS_GROUP = {
  id: "tournaments",
  label: "البطولات",
  icon: Trophy,
  children: [
    { label: "عرض البطولات", path: RECEPTION_EMPLOYEE_ROUTES.tournaments },
    { label: "بيانات البطولة", path: RECEPTION_EMPLOYEE_ROUTES.tournamentsData },
    { label: "قائمة المشاركين", path: RECEPTION_EMPLOYEE_ROUTES.tournamentsParticipants },
  ],
};

const MENU_ITEMS = [
  { label: "الباقات", path: RECEPTION_EMPLOYEE_ROUTES.packages, icon: Package },
  { label: "العروض", path: RECEPTION_EMPLOYEE_ROUTES.offers, icon: Tag },
];

const linkClass = ({ isActive }) =>
  `flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
    isActive
      ? "bg-[#6B5478] text-white shadow-sm shadow-[#6B5478]/30"
      : "text-gray-600 hover:bg-[#6B5478]/8 dark:text-gray-300 dark:hover:bg-[#6B5478]/15"
  }`;

function pathMatches(pathname, path) {
  return pathname === path;
}

function groupContainsActive(group, pathname) {
  return group.children.some((c) => c.path && pathMatches(pathname, c.path));
}

export default function ReceptionEmployeeSidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const [open, setOpen] = useState(() => {
    const initial = { account: groupContainsActive(ACCOUNT_GROUP, pathname) };
    initial.reservations = RESERVATIONS_GROUP.children.some((c) => pathMatches(pathname, c.path));
    initial.devices = DEVICES_GROUP.children.some((c) => pathMatches(pathname, c.path));
    initial.tournaments = TOURNAMENTS_GROUP.children.some((c) => pathMatches(pathname, c.path));
    return initial;
  });

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const handleLogout = async () => {
    const confirmed = await zonesConfirm({
      title: "تسجيل الخروج؟",
      text: "سيتم إنهاء جلستك الحالية والعودة إلى صفحة الدخول.",
      confirmText: "تسجيل الخروج",
      cancelText: "إلغاء",
      danger: true,
    });
    if (!confirmed) return;
    clearAuthSession();
    onNavigate?.();
    navigate("/auth/login", { replace: true });
  };

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col border-s border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      dir="rtl"
    >
      <div className="flex items-center gap-3 bg-gradient-to-l from-[#6B5478] to-[#836a90] px-5 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-white/40">
          <img src={ZONES_LOGO_SRC} alt="ZONES" className="h-full w-full object-cover" />
        </span>
        <div className="text-white">
          <p className="text-sm font-extrabold leading-tight">منصة إدارة الصالات</p>
          <p className="text-[11px] font-semibold text-white/75">لوحة تحكم موظف الاستقبال</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavLink
          to={RECEPTION_EMPLOYEE_ROUTES.dashboard}
          end
          onClick={onNavigate}
          className={linkClass}
        >
          <span className="flex items-center gap-2.5">
            <Home size={17} />
            لوحة التحكم
          </span>
        </NavLink>

        <div>
          <button
            type="button"
            onClick={() => toggle("reservations")}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
              RESERVATIONS_GROUP.children.some((c) => pathMatches(pathname, c.path))
                ? "text-[#6B5478]"
                : "text-gray-600 hover:bg-[#6B5478]/8 dark:text-gray-300 dark:hover:bg-[#6B5478]/15"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CalendarClock size={17} />
              {RESERVATIONS_GROUP.label}
            </span>
            <ChevronDown size={15} className={`transition ${open.reservations ? "rotate-180" : ""}`} />
          </button>
          {open.reservations ? (
            <div className="mt-1 space-y-1 pe-4">
              {RESERVATIONS_GROUP.children.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      isActive
                        ? "bg-[#6B5478]/12 text-[#6B5478]"
                        : "text-gray-500 hover:bg-[#6B5478]/8 dark:text-gray-400"
                    }`
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  {child.label}
                </NavLink>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <button
            type="button"
            onClick={() => toggle("devices")}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
              DEVICES_GROUP.children.some((c) => pathMatches(pathname, c.path))
                ? "text-[#6B5478]"
                : "text-gray-600 hover:bg-[#6B5478]/8 dark:text-gray-300 dark:hover:bg-[#6B5478]/15"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Monitor size={17} />
              {DEVICES_GROUP.label}
            </span>
            <ChevronDown size={15} className={`transition ${open.devices ? "rotate-180" : ""}`} />
          </button>
          {open.devices ? (
            <div className="mt-1 space-y-1 pe-4">
              {DEVICES_GROUP.children.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      isActive
                        ? "bg-[#6B5478]/12 text-[#6B5478]"
                        : "text-gray-500 hover:bg-[#6B5478]/8 dark:text-gray-400"
                    }`
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  {child.label}
                </NavLink>
              ))}
            </div>
          ) : null}
        </div>

        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} end onClick={onNavigate} className={linkClass}>
              <span className="flex items-center gap-2.5">
                <Icon size={17} />
                {item.label}
              </span>
            </NavLink>
          );
        })}

        <div>
          <button
            type="button"
            onClick={() => toggle("tournaments")}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
              TOURNAMENTS_GROUP.children.some((c) => pathMatches(pathname, c.path))
                ? "text-[#6B5478]"
                : "text-gray-600 hover:bg-[#6B5478]/8 dark:text-gray-300 dark:hover:bg-[#6B5478]/15"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Trophy size={17} />
              {TOURNAMENTS_GROUP.label}
            </span>
            <ChevronDown size={15} className={`transition ${open.tournaments ? "rotate-180" : ""}`} />
          </button>
          {open.tournaments ? (
            <div className="mt-1 space-y-1 pe-4">
              {TOURNAMENTS_GROUP.children.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      isActive
                        ? "bg-[#6B5478]/12 text-[#6B5478]"
                        : "text-gray-500 hover:bg-[#6B5478]/8 dark:text-gray-400"
                    }`
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  {child.label}
                </NavLink>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <button
            type="button"
            onClick={() => toggle("account")}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
              groupContainsActive(ACCOUNT_GROUP, pathname)
                ? "text-[#6B5478]"
                : "text-gray-600 hover:bg-[#6B5478]/8 dark:text-gray-300 dark:hover:bg-[#6B5478]/15"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <User size={17} />
              حسابي
            </span>
            <ChevronDown size={15} className={`transition ${open.account ? "rotate-180" : ""}`} />
          </button>
          {open.account ? (
            <div className="mt-1 space-y-1 pe-4">
              {ACCOUNT_GROUP.children.map((child) =>
                child.action === "logout" ? (
                  <button
                    key="logout"
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <LogOut size={14} />
                    {child.label}
                  </button>
                ) : (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    end
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                        isActive
                          ? "bg-[#6B5478]/12 text-[#6B5478]"
                          : "text-gray-500 hover:bg-[#6B5478]/8 dark:text-gray-400"
                      }`
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                    {child.label}
                  </NavLink>
                ),
              )}
            </div>
          ) : null}
        </div>
      </nav>

      <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <p className="text-[11px] font-semibold text-gray-400">إدارة الحجوزات والجلسات</p>
      </div>
    </aside>
  );
}

