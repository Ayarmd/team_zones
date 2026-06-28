import {
  archiveManagerStationAlert,
  createManagerStationAlert,
  fetchArchivedManagerAlerts,
  fetchManagerAlerts,
} from "../../alerts/data/managerAlertsApi";

const EMERGENCY_PREFIX = "طوارئ: ";

function mapAlertToLogRow(alert) {
  const name = String(alert.name || "").replace(EMERGENCY_PREFIX, "");
  return {
    id: alert.id,
    typeValue: name,
    description: alert.situationDescription || "",
    occurredAt: (alert.startDate || "").replace("T", " ").slice(0, 16),
  };
}

export function mapNotifyTargetToAudiences(target) {
  if (target === "customers") return ["customers_only"];
  if (target === "employees") return ["reception_only", "maintenance_only"];
  return ["everyone"];
}

export async function fetchEmergencyLogs() {
  const [activeResult, archivedResult] = await Promise.all([
    fetchManagerAlerts({ status: "active" }),
    fetchArchivedManagerAlerts(),
  ]);

  if (!activeResult.ok) {
    return { ok: false, error: activeResult.error, logs: [], archivedCount: 0 };
  }

  const logs = activeResult.alerts
    .filter((alert) => alert.severity === "high" || alert.severity === "critical")
    .map(mapAlertToLogRow);

  return {
    ok: true,
    logs,
    archivedCount: archivedResult.ok ? archivedResult.alerts.length : 0,
  };
}

export async function registerEmergencyIncident({ typeLabel, description, occurredAt }) {
  return createManagerStationAlert({
    name: `${EMERGENCY_PREFIX}${typeLabel}`,
    situationDescription: description,
    targetAudience: "everyone",
    severity: "high",
    alternativeInstructions: occurredAt ? `وقت الحدوث: ${occurredAt}` : null,
  });
}

export async function sendEmergencyNotification({ text, target }) {
  const audiences = mapNotifyTargetToAudiences(target);
  const results = [];

  for (const targetAudience of audiences) {
    const result = await createManagerStationAlert({
      name: `${EMERGENCY_PREFIX}إشعار طارئ`,
      situationDescription: text,
      targetAudience,
      severity: "critical",
    });
    results.push(result);
    if (!result.ok) return result;
  }

  return { ok: true, message: results[0]?.message };
}

export async function archiveEmergencyLog(alertId) {
  return archiveManagerStationAlert(alertId);
}
