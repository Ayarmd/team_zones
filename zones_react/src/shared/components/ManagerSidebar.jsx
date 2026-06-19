import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  Home,
  LogOut,
  Tag,
  Trophy,
  MessageCircle,
  User,
  Users,
} from "lucide-react";
import { zonesConfirm } from "../utils/zonesAlerts";
import { MANAGER_MENU } from "../config/managerNavigation";
import { clearAuthSession } from "../../features/auth/data/mockUsersStorage";

const ZONES_LOGO_SRC = "/zones-logo.png";

const MENU_GROUPS = [
  MANAGER_MENU.account,
  MANAGER_MENU.hall,
  MANAGER_MENU.staff,
  MANAGER_MENU.faults,
  MANAGER_MENU.alerts,
  MANAGER_MENU.tournaments,
  MANAGER_MENU.finance,
];

const EXACT_PATHS = [
  "/employees",
  "/employees/reception",
  "/employees/archive",
  "/offers",
  "/interaction",
  "/tournaments",
  "/tournaments/data",
  "/tournaments/new",
  "/tournaments/participants",
  "/finance",
  "/finance/expenses",
  "/finance/net-profit",
  "/finance/revenues",
  "/faults",
  "/faults/archive",
  "/alerts/log",
  "/alerts/archive",
  "/alerts/stop-bookings",
];

function pathMatches(pathname, path, search = "") {
  if (!path) return false;
  const base = path.split("?")[0];

  if (path.includes("?")) {
    const qs = new URLSearchParams(path.split("?")[1]);
    const current = new URLSearchParams(search);
    for (const [k, v] of qs.entries()) {
      if (current.get(k) !== v) return false;
    }
    return pathname === base;
  }

  if (pathname === base) return true;

  if (EXACT_PATHS.includes(base)) return false;

  return pathname.startsWith(`${base}/`);
}

function nodeActive(node, pathname, search = "") {
  if (node.path && pathMatches(pathname, node.path, search)) return true;
  return (node.children || []).some((c) => nodeActive(c, pathname, search));
}

function collectOpenIds(nodes, pathname, acc = {}, search = "") {
  nodes.forEach((node) => {
    if (node.children?.length) {
      if (nodeActive(node, pathname, search)) acc[node.id || node.label] = true;
      collectOpenIds(node.children, pathname, acc, search);
    }
  });
  return acc;
}

const topLinkClass = ({ isActive }) =>
  `flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
    isActive
      ? "bg-[#6B5478] text-white shadow-sm shadow-[#6B5478]/30"
      : "text-gray-600 hover:bg-[#6B5478]/8 dark:text-gray-300 dark:hover:bg-[#6B5478]/15"
  }`;

function sidebarMainItemClass(active) {
  return `flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
    active
      ? "text-[#6B5478]"
      : "text-gray-600 hover:bg-[#6B5478]/8 dark:text-gray-300 dark:hover:bg-[#6B5478]/15"
  }`;
}

function StandaloneMenuLink({ to, icon: Icon, label, pathname, onNavigate }) {
  const active = pathname === to;
  return (
    <NavLink to={to} end onClick={onNavigate} className={sidebarMainItemClass(active)}>
      <Icon size={17} />
      {label}
    </NavLink>
  );
}

function NestedItems({ items, depth, open, toggle, onNavigate, pathname, search }) {
  return (
    <div className={`space-y-1 ${depth > 0 ? "mt-1 pe-3" : ""}`}>
      {items.map((item) => {
        const key = item.id || item.path || item.label;

        if (item.action === "logout") {
          return (
            <button
              key={key}
              type="button"
              onClick={onNavigate.logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              style={{ paddingInlineStart: `${12 + depth * 10}px` }}
            >
              <LogOut size={14} />
              {item.label}
            </button>
          );
        }

        if (item.children?.length) {
          const id = item.id || item.label;
          const isOpen = open[id];
          const active = nodeActive(item, pathname, search);
          return (
            <div key={key}>
              <div className="flex items-center gap-1">
                {item.path ? (
                  <NavLink
                    to={item.path}
                    end
                    onClick={onNavigate.close}
                    className={({ isActive }) =>
                      `flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                        isActive || active
                          ? "bg-[#6B5478]/12 text-[#6B5478]"
                          : "text-gray-500 hover:bg-[#6B5478]/8 dark:text-gray-400"
                      }`
                    }
                    style={{ paddingInlineStart: `${12 + depth * 10}px` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                    {item.label}
                  </NavLink>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className={`flex flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      active ? "text-[#6B5478]" : "text-gray-500 hover:bg-[#6B5478]/8 dark:text-gray-400"
                    }`}
                    style={{ paddingInlineStart: `${12 + depth * 10}px` }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      {item.label}
                    </span>
                    <ChevronDown size={13} className={`transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                )}
                {item.path ? (
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="توسيع"
                  >
                    <ChevronDown size={13} className={`transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                ) : null}
              </div>
              {isOpen ? (
                <NestedItems
                  items={item.children}
                  depth={depth + 1}
                  open={open}
                  toggle={toggle}
                  onNavigate={onNavigate}
                  pathname={pathname}
                  search={search}
                />
              ) : null}
            </div>
          );
        }

        return (
          <NavLink
            key={key}
            to={item.path}
            end
            onClick={onNavigate.close}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                isActive
                  ? "bg-[#6B5478]/12 text-[#6B5478]"
                  : "text-gray-500 hover:bg-[#6B5478]/8 dark:text-gray-400"
              }`
            }
            style={{ paddingInlineStart: `${12 + depth * 10}px` }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
            {item.label}
          </NavLink>
        );
      })}
    </div>
  );
}

function MenuGroup({ group, icon: Icon, open, toggle, onNavigate, pathname, search }) {
  const id = group.id;
  const isOpen = open[id];
  const active = nodeActive(group, pathname, search);
  return (
    <div>
      <button
        type="button"
        onClick={() => toggle(id)}
        className={`${sidebarMainItemClass(active)} justify-between`}
      >
        <span className="flex items-center gap-2.5">
          <Icon size={17} />
          {group.label}
        </span>
        <ChevronDown size={15} className={`transition ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen ? (
        <NestedItems
          items={group.children}
          depth={0}
          open={open}
          toggle={toggle}
          onNavigate={onNavigate}
          pathname={pathname}
          search={search}
        />
      ) : null}
    </div>
  );
}

export default function ManagerSidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const search = location.search;

  const initialOpen = useMemo(() => {
    const acc = {};
    MENU_GROUPS.forEach((g) => {
      if (nodeActive(g, pathname, search)) acc[g.id] = true;
    });
    collectOpenIds(
      MENU_GROUPS.flatMap((g) => g.children || []),
      pathname,
      acc,
      search,
    );
    return acc;
  }, [pathname, search]);

  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    setOpen((prev) => ({ ...prev, ...initialOpen }));
  }, [initialOpen]);

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const handleLogout = async () => {
    const confirmed = await zonesConfirm({
      title: "تسجيل الخروج؟",
      text: "سيتم إنهاء جلستك الحالية.",
      confirmText: "تسجيل الخروج",
      cancelText: "إلغاء",
      danger: true,
    });
    if (!confirmed) return;
    clearAuthSession();
    onNavigate?.();
    navigate("/auth/login", { replace: true });
  };

  const navHandlers = { close: onNavigate, logout: handleLogout };

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col border-s border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      dir="rtl"
    >
      <div className="flex items-center gap-3 bg-gradient-to-l from-[#6B5478] to-[#836a90] px-5 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-white/40">
          <img src={ZONES_LOGO_SRC} alt="GameZones" className="h-full w-full object-cover" />
        </span>
        <div className="text-white">
          <p className="text-sm font-extrabold leading-tight">منصة إدارة الصالات</p>
          <p className="text-[11px] font-semibold text-white/75">لوحة تحكم المدير</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavLink to={MANAGER_MENU.dashboard.path} onClick={onNavigate} className={topLinkClass}>
          <span className="flex items-center gap-2.5">
            <Home size={17} />
            {MANAGER_MENU.dashboard.label}
          </span>
        </NavLink>

        <MenuGroup
          group={MANAGER_MENU.hall}
          icon={Building2}
          open={open}
          toggle={toggle}
          onNavigate={navHandlers}
          pathname={pathname}
          search={search}
        />

        <StandaloneMenuLink
          to={MANAGER_MENU.interaction.path}
          icon={MessageCircle}
          label={MANAGER_MENU.interaction.label}
          pathname={pathname}
          onNavigate={onNavigate}
        />

        <MenuGroup
          group={MANAGER_MENU.staff}
          icon={Users}
          open={open}
          toggle={toggle}
          onNavigate={navHandlers}
          pathname={pathname}
          search={search}
        />

        <MenuGroup
          group={MANAGER_MENU.faults}
          icon={AlertTriangle}
          open={open}
          toggle={toggle}
          onNavigate={navHandlers}
          pathname={pathname}
          search={search}
        />

        <MenuGroup
          group={MANAGER_MENU.alerts}
          icon={Bell}
          open={open}
          toggle={toggle}
          onNavigate={navHandlers}
          pathname={pathname}
          search={search}
        />

        <StandaloneMenuLink
          to={MANAGER_MENU.offers.path}
          icon={Tag}
          label={MANAGER_MENU.offers.label}
          pathname={pathname}
          onNavigate={onNavigate}
        />

        <MenuGroup
          group={MANAGER_MENU.tournaments}
          icon={Trophy}
          open={open}
          toggle={toggle}
          onNavigate={navHandlers}
          pathname={pathname}
          search={search}
        />

        <MenuGroup
          group={MANAGER_MENU.finance}
          icon={BarChart3}
          open={open}
          toggle={toggle}
          onNavigate={navHandlers}
          pathname={pathname}
          search={search}
        />

        <MenuGroup
          group={{ ...MANAGER_MENU.account, icon: User }}
          icon={User}
          open={open}
          toggle={toggle}
          onNavigate={navHandlers}
          pathname={pathname}
          search={search}
        />
      </nav>

      <div className="border-t border-gray-100 px-3 py-3 dark:border-gray-800">
        <p className="text-center text-[10px] text-gray-400">GameZones © 2026</p>
      </div>
    </aside>
  );
}
