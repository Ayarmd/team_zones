import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme/useTheme";

export default function ThemeSwitch({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      dir="ltr"
      className={`inline-flex items-center gap-2 p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B5478]/40 focus-visible:ring-offset-2 ${className}`}
      aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
      title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
    >
      <Sun
        size={18}
        strokeWidth={2}
        className={isDark ? "text-gray-400 opacity-50" : "text-[#6B5478]"}
      />
      <Moon
        size={18}
        strokeWidth={2}
        className={isDark ? "text-[#6B5478] dark:text-[#c4b5d0]" : "text-gray-400 opacity-50"}
      />
    </button>
  );
}
