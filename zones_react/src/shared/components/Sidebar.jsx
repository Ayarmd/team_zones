import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import Logo from "./Logo";
import IconButton from "./ui/IconButton";
import { sidebarItems } from "../config/navigation";
import ThemePill from "./ThemePill";
import { clearAuthSession } from "../../features/auth/data/mockUsersStorage";

export default function Sidebar({ items = sidebarItems, isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();

  const logout = () => {
    clearAuthSession();
    navigate("/auth/login", { replace: true });
    onClose();
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <IconButton icon={X} label="إغلاق القائمة" tone="muted" className="mobile-only" onClick={onClose} />
        </div>
        <nav className="sidebar-nav no-scrollbar">
          {items.map((item) =>
            item.enabled ? (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.end !== undefined ? item.end : item.path !== "/tournaments"}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </NavLink>
            ) : (
              <span key={item.label} className="sidebar-link sidebar-link-muted">
                {item.label}
              </span>
            ),
          )}
        </nav>
        <div className="sidebar-footer">
          <button className="ghost-link sidebar-logout" type="button" onClick={logout}>
            <LogOut size={18} />
            تسجيل الخروج
          </button>
          <div className="sidebar-theme flex justify-center">
            <ThemePill />
          </div>
        </div>
      </aside>
      {isOpen ? <button className="sidebar-overlay" onClick={onClose} type="button" aria-label="close" /> : null}
    </>
  );
}
