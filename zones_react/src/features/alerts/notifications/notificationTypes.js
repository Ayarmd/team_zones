import {
  AlertTriangle,
  Ban,
  Bell,
  CheckCircle2,
  Clock,
  Megaphone,
  PlayCircle,
  Settings,
  UserPlus,
  Wrench,
} from "lucide-react";

export const NOTIFICATION_TYPE_META = {
  manager_alert: {
    label: "تنبيه إداري",
    Icon: Megaphone,
    unreadClass: "bg-[#6B5478]/10 border-[#6B5478]/20 dark:bg-[#6B5478]/15 dark:border-[#6B5478]/25",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-[#6B5478] dark:text-[#c4b5d0]",
  },
  station_alert: {
    label: "تنبيه الصالة",
    Icon: Megaphone,
    unreadClass: "bg-[#6B5478]/10 border-[#6B5478]/20 dark:bg-[#6B5478]/15 dark:border-[#6B5478]/25",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-[#6B5478] dark:text-[#c4b5d0]",
  },
  /** @deprecated legacy API type — maps to station_alert */
  manager_broadcast: {
    label: "تنبيه الصالة",
    Icon: Megaphone,
    unreadClass: "bg-[#6B5478]/10 border-[#6B5478]/20 dark:bg-[#6B5478]/15 dark:border-[#6B5478]/25",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-[#6B5478] dark:text-[#c4b5d0]",
  },
  bookings_stop: {
    label: "إيقاف الحجوزات",
    Icon: Ban,
    unreadClass: "bg-red-500/10 border-red-500/20 dark:bg-red-950/30 dark:border-red-900/40",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-red-500 dark:text-red-400",
  },
  bookings_start: {
    label: "استئناف الحجوزات",
    Icon: PlayCircle,
    unreadClass: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-950/25 dark:border-emerald-900/35",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-emerald-500 dark:text-emerald-400",
  },
  maintenance: {
    label: "صيانة",
    Icon: Wrench,
    unreadClass: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-950/25 dark:border-amber-900/35",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-amber-500 dark:text-amber-400",
  },
  financial_collected: {
    label: "عمولة محصّلة",
    Icon: CheckCircle2,
    unreadClass: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-950/25 dark:border-emerald-900/35",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-emerald-500 dark:text-emerald-400",
  },
  financial_due: {
    label: "عمولة مستحقة",
    Icon: Clock,
    unreadClass: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-950/25 dark:border-amber-900/35",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-amber-500 dark:text-amber-400",
  },
  join_request: {
    label: "طلب انضمام",
    Icon: UserPlus,
    unreadClass: "bg-sky-500/10 border-sky-500/20 dark:bg-sky-950/25 dark:border-sky-900/35",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-sky-500 dark:text-sky-400",
  },
  system: {
    label: "نظام",
    Icon: Settings,
    unreadClass: "bg-gray-500/10 border-gray-500/20 dark:bg-gray-800/50 dark:border-gray-700/50",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-gray-500 dark:text-gray-400",
  },
  default: {
    label: "إشعار",
    Icon: Bell,
    unreadClass: "bg-[#6B5478]/8 border-[#6B5478]/15 dark:bg-[#6B5478]/12 dark:border-[#6B5478]/20",
    readClass: "bg-gray-50/40 border-transparent dark:bg-gray-800/30",
    iconClass: "text-[#6B5478] dark:text-[#c4b5d0]",
  },
};

export function resolveNotificationTypeMeta(type) {
  return NOTIFICATION_TYPE_META[type] ?? NOTIFICATION_TYPE_META.default;
}

export function financialAlertType(alert) {
  if (alert?.type === "collected") return "financial_collected";
  return "financial_due";
}
