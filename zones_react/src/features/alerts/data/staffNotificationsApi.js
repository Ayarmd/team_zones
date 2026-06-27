import { apiClient, mapApiErrorMessage } from "../../../shared/api/apiClient";

function mapStaffNotification(row) {
  const createdAt = row.createdAt ?? row.created_at ?? "";
  return {
    id: row.id,
    type: row.type || "station_alert",
    severity: row.severity || row.payload?.severity || "medium",
    name: row.title || row.name || "",
    message: row.message || row.body || "",
    instructions: row.instructions || row.payload?.alternative_instructions || "",
    isRead: Boolean(row.is_read ?? row.read_at),
    createdAt: createdAt ? formatDisplay(createdAt) : "",
    _createdAtIso: createdAt,
  };
}

function formatDisplay(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("ar-LY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

export async function fetchStaffNotifications() {
  try {
    const { data } = await apiClient.get("/staff/notifications");
    const notifications = (data.notifications || []).map(mapStaffNotification);
    return {
      ok: true,
      notifications,
      unreadCount: data.unread_count ?? notifications.filter((n) => !n.isRead).length,
    };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), notifications: [], unreadCount: 0 };
  }
}

export async function markStaffNotificationRead(notificationId) {
  try {
    await apiClient.post(`/staff/notifications/${notificationId}/read`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function deleteStaffNotification(notificationId) {
  try {
    await apiClient.delete(`/staff/notifications/${notificationId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function deleteStaffNotificationsBatch(ids) {
  try {
    await apiClient.post("/staff/notifications/delete-batch", { ids });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function deleteAllStaffNotifications() {
  try {
    await apiClient.delete("/staff/notifications");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export { mapStaffNotification };
