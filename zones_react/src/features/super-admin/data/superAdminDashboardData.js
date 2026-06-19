import { calcCommission, getSuperAdminState } from "./superAdminStorage";
import { HALL_REQUEST_STATUS, HALL_REQUEST_STATUS_LABELS } from "./hallRequestStatus";

export const ZONES_LOGO_SRC = "/zones-logo.png";

function countActiveUsers(list) {
  return list.filter((u) => u.active !== false).length;
}

/** ملخص لوحة التحكم — بيانات حقيقية من التخزين */
export function getDashboardView() {
  const state = getSuperAdminState();
  const activeHalls = (state.activeHalls || []).filter((h) => h.status === "active");
  const fallbackRate = state.systemSettings?.globalCommissionRate ?? 3;

  const expectedCommission = activeHalls.reduce((sum, hall) => {
    const rate = hall.commissionRate ?? fallbackRate;
    return sum + calcCommission(hall.monthlyIncome, rate);
  }, 0);

  const kpis = {
    activeHalls: activeHalls.length,
    pendingRequests: (state.pendingRequests || []).filter((r) => r.status === HALL_REQUEST_STATUS.pending)
      .length,
  };

  const platformSummary = {
    activeManagers: countActiveUsers(state.managers || []),
    activeReception: countActiveUsers(
      (state.employees || []).filter((e) => e.role === "reception"),
    ),
    activeMaintenance: countActiveUsers(
      (state.employees || []).filter((e) => e.role === "maintenance"),
    ),
    activeHallCount: activeHalls.length,
    expectedCommission: Math.round(expectedCommission * 100) / 100,
    globalRate: fallbackRate,
    monthLabel: new Date().toLocaleDateString("ar-LY", { month: "long", year: "numeric" }),
  };

  const recentRequests = (state.pendingRequests || [])
    .filter((r) => r.status === HALL_REQUEST_STATUS.pending)
    .slice(0, 4)
    .map((r) => ({
      id: r.id,
      hallName: r.hallName,
      city: r.city || r.address?.split("—")[0]?.trim() || r.address,
      phone: r.commercialPhone,
      employeeCount: r.employeeCount,
      status: HALL_REQUEST_STATUS_LABELS.pending,
    }));

  return { kpis, platformSummary, recentRequests };
}
