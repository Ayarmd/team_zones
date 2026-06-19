import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  BarChart3,
  Building2,
  ChevronDown,
  Home,
  KeyRound,
  LogOut,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { zonesConfirm } from "../../../shared/utils/zonesAlerts";
import { SUPER_ADMIN_ROUTES } from "../data/superAdminConstants";
import { clearSuperAdminSession } from "../data/superAdminAuth";
import { ZONES_LOGO_SRC } from "../data/superAdminDashboardData";

const SINGLE_ITEMS_TOP = [
  { label: "لوحة التحكم", path: SUPER_ADMIN_ROUTES.dashboard, icon: Home },
  { label: "طلبات الانضمام", path: SUPER_ADMIN_ROUTES.pending, icon: UserPlus, badgeKey: "pending" },
];

const GROUPS = [
  {
    id: "halls",
    label: "إدارة الصالات",
    icon: Building2,
    children: [{ label: "كل الصالات", path: SUPER_ADMIN_ROUTES.halls }],
  },
  {
    id: "users",
    label: "إدارة المستخدمين",
    icon: Users,
    children: [
      { label: "مدراء الصالات", path: SUPER_ADMIN_ROUTES.managers },
      { label: "الموظفون", path: SUPER_ADMIN_ROUTES.employees },
    ],
  },
  {
    id: "archive",
    label: "الأرشيف",
    icon: Archive,
    children: [
      { label: "أرشيف الصالات", path: SUPER_ADMIN_ROUTES.archiveHalls },
      { label: "أرشيف المدراء", path: SUPER_ADMIN_ROUTES.archiveManagers },
      { label: "أرشيف الموظفين", path: SUPER_ADMIN_ROUTES.archiveEmployees },
    ],
  },
];

const SINGLE_ITEMS_BOTTOM = [
  { label: "المالية والعمولات", path: SUPER_ADMIN_ROUTES.commissions, icon: BarChart3 },
  { label: "إعدادات النظام", path: SUPER_ADMIN_ROUTES.settings, icon: Settings },
];

const ACCOUNT_GROUP = {
  id: "account",
  label: "حسابي",
  icon: User,
  children: [
    { label: "ملف شخصي", path: SUPER_ADMIN_ROUTES.profile, icon: User },
    { label: "تغيير كلمة المرور", path: SUPER_ADMIN_ROUTES.changePassword, icon: KeyRound },
    { label: "تسجيل الخروج", action: "logout", icon: LogOut },
  ],
};

const linkClass = ({ isActive }) =>
  `flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
    isActive
      ? "bg-[#6B5478] text-white shadow-sm shadow-[#6B5478]/30"
      : "text-gray-600 hover:bg-[#6B5478]/8 dark:text-gray-300 dark:hover:bg-[#6B5478]/15"
  }`;

export default function SuperAdminSidebar({ pendingCount = 0, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const groupContainsActive = (group) => group.children.some((c) => location.pathname === c.path);
  const [open, setOpen] = useState(() => {
    const initial = {};
    [...GROUPS, ACCOUNT_GROUP].forEach((g) => (initial[g.id] = g.defaultOpen || groupContainsActive(g)));
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
    clearSuperAdminSession();
    onNavigate?.();
    navigate(SUPER_ADMIN_ROUTES.login, { replace: true });
  };

  const renderGroup = (group) => {
    const Icon = group.icon;
    const isOpen = open[group.id];
    const activeParent = groupContainsActive(group);
    return (
      <div key={group.id}>
        <button
          type="button"
          onClick={() => toggle(group.id)}
          className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
            activeParent
              ? "text-[#6B5478]"
              : "text-gray-600 hover:bg-[#6B5478]/8 dark:text-gray-300 dark:hover:bg-[#6B5478]/15"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Icon size={17} />
            {group.label}
          </span>
          <ChevronDown size={15} className={`transition ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen ? (
          <div className="mt-1 space-y-1 pe-4">
            {group.children.map((child) =>
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
    );
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
          <p className="text-[11px] font-semibold text-white/75">لوحة تحكم الأدمن</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {SINGLE_ITEMS_TOP.map((item) => {
          const Icon = item.icon;
          const badge = item.badgeKey === "pending" && pendingCount > 0 ? pendingCount : null;
          return (
            <NavLink key={item.path} to={item.path} onClick={onNavigate} className={linkClass}>
              <span className="flex items-center gap-2.5">
                <Icon size={17} />
                {item.label}
              </span>
              {badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-extrabold text-white">
                  {badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}

        {GROUPS.map(renderGroup)}

        {SINGLE_ITEMS_BOTTOM.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} onClick={onNavigate} className={linkClass}>
              <span className="flex items-center gap-2.5">
                <Icon size={17} />
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {renderGroup(ACCOUNT_GROUP)}
      </nav>
    </aside>
  );
}
