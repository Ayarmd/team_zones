/** مسارات واجهة مدير الصالة */
export const MANAGER_ROUTES = {
  dashboard: "/dashboard",
  profile: "/profile",
  changePassword: "/profile/change-password",
  lounge: "/lounge",
  devices: "/devices",
  packages: "/packages",
  hallArchive: "/hall/archive",
  reception: "/employees/reception",
  employees: "/employees",
  employeesArchive: "/employees/archive",
  offers: "/offers",
  tournaments: "/tournaments",
  tournamentData: "/tournaments/data",
  tournamentNew: "/tournaments/new",
  tournamentParticipants: "/tournaments/participants",
  finance: "/finance",
  expenses: "/finance/expenses",
  analysis: "/finance/net-profit",
  revenues: "/finance/revenues",
  emergency: "/emergency",
  faults: "/faults",
  faultsArchive: "/faults/archive",
  alertsLog: "/alerts/log",
  alertsArchive: "/alerts/archive",
  alertsStopBookings: "/alerts/stop-bookings",
  interaction: "/interaction",
};

/** شجرة القائمة — نفس أسلوب لوحة الأدمن */
export const MANAGER_MENU = {
  dashboard: { label: "لوحة التحكم", path: MANAGER_ROUTES.dashboard },
  account: {
    id: "account",
    label: "حسابي",
    children: [
      { label: "ملف شخصي", path: MANAGER_ROUTES.profile },
      { label: "تغيير كلمة المرور", path: MANAGER_ROUTES.changePassword },
      { label: "تسجيل الخروج", action: "logout" },
    ],
  },
  hall: {
    id: "hall",
    label: "إدارة الصالة",
    children: [
      { id: "lounge", label: "بيانات الصالة", path: MANAGER_ROUTES.lounge },
      { id: "devices", label: "أجهزة", path: MANAGER_ROUTES.devices },
      { id: "packages", label: "الباقات", path: MANAGER_ROUTES.packages },
      { id: "hallArchive", label: "أرشيف", path: MANAGER_ROUTES.hallArchive },
    ],
  },
  staff: {
    id: "staff",
    label: "موظف",
    children: [
      { id: "reception", label: "استقبال", path: MANAGER_ROUTES.reception },
      { id: "maintenance", label: "صيانة", path: MANAGER_ROUTES.employees },
      { id: "archive", label: "أرشفة", path: MANAGER_ROUTES.employeesArchive },
    ],
  },
  faults: {
    id: "faults",
    label: "الأعطال",
    children: [
      { label: "الأعطال", path: MANAGER_ROUTES.faults },
      { label: "الأعطال المؤرشفة", path: MANAGER_ROUTES.faultsArchive },
    ],
  },
  alerts: {
    id: "alerts",
    label: "إدارة تنبيهات",
    children: [
      { label: "سجل التنبيهات", path: MANAGER_ROUTES.alertsLog },
      { label: "أرشفة التنبيهات", path: MANAGER_ROUTES.alertsArchive },
      { label: "إيقاف الحجوزات", path: MANAGER_ROUTES.alertsStopBookings },
    ],
  },
  offers: { label: "عروض", path: MANAGER_ROUTES.offers },
  interaction: { label: "تفاعل", path: MANAGER_ROUTES.interaction },
  tournaments: {
    id: "tournaments",
    label: "بطولات",
    children: [
      { label: "عرض البطولات", path: MANAGER_ROUTES.tournaments },
      { label: "بيانات البطولة", path: MANAGER_ROUTES.tournamentData },
      { label: "قائمة المشاركين", path: MANAGER_ROUTES.tournamentParticipants },
    ],
  },
  finance: {
    id: "finance",
    label: "إدارة مالية",
    children: [
      { label: "بيانات المصروف", path: MANAGER_ROUTES.expenses },
      { label: "التحليل", path: MANAGER_ROUTES.analysis },
    ],
  },
};
