import { apiClient, mapApiErrorMessage } from "../../../shared/api/apiClient";
import { normalizeRole, normalizeShift } from "./employeeMeta";

function mapApiUserToEmployee(user) {
  const role = normalizeRole(user.role || user.roles?.[0]);
  const isArchived = user.account_status === "inactive" || user.account_status === "suspended";

  return {
    id: user.id,
    userId: user.id,
    fullName: user.full_name || user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role,
    shift: normalizeShift(user.work_shift),
    status: user.account_status === "active" ? "working" : "leave",
    joinDate: user.created_at ? String(user.created_at).slice(0, 10) : "",
    lastLogin: user.last_login_at || null,
    hallName: user.hall_name || user.station_name || "",
    accountStatus: user.account_status || "active",
    isArchived,
    archivedAt: isArchived ? user.updated_at : null,
    isPendingInvite: false,
  };
}

function mapPendingInvitation(inv) {
  return {
    id: inv.id,
    invitationId: inv.invitation_id,
    fullName: inv.full_name || inv.name || "—",
    email: inv.email || "",
    phone: "—",
    role: normalizeRole(inv.role),
    shift: normalizeShift(inv.shift),
    status: "pending_invite",
    joinDate: inv.created_at ? String(inv.created_at).slice(0, 10) : "",
    lastLogin: null,
    hallName: inv.station_name || "",
    accountStatus: "pending",
    isArchived: false,
    isPendingInvite: true,
    registerLink: inv.register_link || "",
  };
}

export async function fetchManagerEmployees() {
  try {
    const { data } = await apiClient.get("/manager/employees");
    const employees = (data.employees || []).map(mapApiUserToEmployee);
    const pending = (data.pending_invitations || []).map(mapPendingInvitation);

    return {
      ok: true,
      employees: [...pending, ...employees],
    };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), employees: [] };
  }
}

export async function cancelManagerInvitation(invitationId) {
  try {
    const { data } = await apiClient.delete(`/manager/employees/invitations/${invitationId}`);
    return { ok: true, message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function updateManagerEmployee(id, patch) {
  try {
    const body = {};
    if (patch.shift) body.work_shift = patch.shift;
    if (patch.accountStatus) {
      body.account_status =
        patch.accountStatus === "archived" || patch.isArchived ? "suspended" : "active";
    }

    const { data } = await apiClient.put(`/manager/employees/${id}`, body);
    return { ok: true, employee: mapApiUserToEmployee(data.employee), message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}
