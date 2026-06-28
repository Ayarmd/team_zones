import { apiClient, mapApiErrorMessage } from "../../../shared/api/apiClient";
import { typeLabelFromType } from "./deviceNaming";

function mapApiDevice(row) {
  const type = row.device_type || row.type || "ps5";
  const displayName = String(row.display_name || row.name || "").trim();
  const deviceCode = String(row.device_code || row.deviceCode || "").trim();
  const operationalStatus = row.operational_status || row.operationalStatus || "active";
  return {
    id: row.id,
    name: displayName || deviceCode,
    type,
    typeLabel: row.typeLabel || typeLabelFromType(type),
    packageId: row.package_id ?? row.packageId ?? null,
    hasFault: Boolean(row.has_fault ?? row.hasFault ?? operationalStatus !== "active"),
    maintenanceInProgress: Boolean(row.maintenance_in_progress ?? row.maintenanceInProgress),
    operationalStatus,
    isActive: operationalStatus === "active",
    isMaintenance: operationalStatus === "maintenance",
    isArchived: row.operational_status === "inactive" && row.is_archived === true,
    notes: row.notes || "",
    createdAt: row.created_at || row.createdAt || "—",
    deviceCode: deviceCode || displayName,
    sessionsThisMonth: Number(row.sessions_this_month ?? row.sessionsThisMonth ?? 0),
    lastSessionAt: row.last_session_at || row.lastSessionAt || null,
  };
}

function mapOperationalStatus(payload) {
  if (payload.isArchived) return "inactive";
  if (payload.maintenanceInProgress || payload.hasFault || payload.isMaintenance) return "maintenance";
  if (payload.isActive === false) return "inactive";
  return "active";
}

export { mapApiDevice };

export async function fetchManagerDevices(params = {}) {
  try {
    const { data } = await apiClient.get("/manager/devices", { params });
    const list = data.devices || [];
    return { ok: true, devices: list.map(mapApiDevice) };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), devices: [] };
  }
}

export async function createManagerDevice(payload) {
  try {
    const { data } = await apiClient.post("/manager/devices", {
      display_name: payload.name,
      device_code: payload.deviceCode || payload.name || `DEV-${Date.now()}`,
      device_type: payload.type,
      package_id: payload.packageId,
      operational_status: mapOperationalStatus(payload),
      notes: payload.notes,
    });
    return { ok: true, device: mapApiDevice(data.device), message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function updateManagerDevice(id, payload) {
  try {
    const { data } = await apiClient.put(`/manager/devices/${id}`, {
      display_name: payload.name,
      device_type: payload.type,
      package_id: payload.packageId,
      operational_status: payload.isArchived ? "inactive" : mapOperationalStatus(payload),
      notes: payload.notes,
    });
    return { ok: true, device: mapApiDevice(data.device), message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function deleteManagerDevice(id) {
  try {
    const { data } = await apiClient.delete(`/manager/devices/${id}`);
    return { ok: true, message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}
