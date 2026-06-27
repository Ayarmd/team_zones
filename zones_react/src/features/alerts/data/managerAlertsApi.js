import { apiClient, mapApiErrorMessage } from "../../../shared/api/apiClient";

export const MANAGER_ALERTS_ARCHIVED_EVENT = "zones-manager-alerts-archived";

function mapStationAlert(row) {
  const isArchived = row.isArchived ?? row.is_archived ?? row.status === "stopped";
  return {
    id: row.id,
    name: row.name,
    situationDescription: row.situationDescription ?? row.body ?? "",
    targetAudience: row.targetAudience ?? row.target_audience ?? "customers_only",
    targetCategories: row.targetCategories,
    severity: row.severity ?? "medium",
    status: row.status ?? (isArchived ? "stopped" : "active"),
    isArchived,
    alternativeInstructions: row.alternativeInstructions ?? row.alternative_instructions ?? "",
    startDate: row.startDate ?? row.createdAt ?? "",
    endDate: row.endDate ?? "",
    source: "api",
  };
}

export function emitAlertsArchived(archivedAlerts = []) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MANAGER_ALERTS_ARCHIVED_EVENT, {
      detail: { alerts: archivedAlerts },
    }),
  );
}

export async function fetchManagerAlerts({ status = "active" } = {}) {
  try {
    const { data } = await apiClient.get("/manager/alerts", { params: { status } });
    return { ok: true, alerts: (data.alerts || []).map(mapStationAlert) };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), alerts: [] };
  }
}

export async function fetchArchivedManagerAlerts() {
  return fetchManagerAlerts({ status: "stopped" });
}

export async function createManagerStationAlert(payload) {
  try {
    const { data } = await apiClient.post("/manager/alerts", {
      name: payload.name,
      situation_description: payload.situationDescription || payload.message || "",
      target_audience: payload.targetAudience || "customers_only",
      severity: payload.severity || "medium",
      alternative_instructions: payload.alternativeInstructions || null,
    });
    return {
      ok: true,
      alert: mapStationAlert(data.alert),
      delivery: data.delivery,
      message: data.message,
    };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function archiveManagerStationAlert(alertId) {
  try {
    const { data } = await apiClient.patch(`/manager/alerts/${alertId}/archive`);
    const alert = mapStationAlert(data.alert);
    return { ok: true, alert, message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export { mapStationAlert };
