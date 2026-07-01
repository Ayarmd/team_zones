import { apiClient, mapApiErrorMessage } from "../../../shared/api/apiClient";
import { getSuperAdminToken } from "../../super-admin/data/superAdminAuth";
import { HALL_REQUEST_STATUS } from "./hallRequestStatus";

function notifyHallJoinRequestsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hall-join-requests-updated"));
  }
}

function authHeaders() {
  const token = getSuperAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchHallJoinRequests() {
  try {
    const { data } = await apiClient.get("/hall-join-requests", { headers: authHeaders() });
    return { ok: true, requests: data.requests || [] };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), requests: [] };
  }
}

export async function fetchPendingJoinRequestsSummary() {
  const result = await fetchHallJoinRequests();
  if (!result.ok) {
    return { ok: false, error: result.error, pendingCount: 0, pendingRequests: [] };
  }

  const pendingRequests = result.requests.filter((r) => r.status === HALL_REQUEST_STATUS.pending);

  return {
    ok: true,
    pendingCount: pendingRequests.length,
    pendingRequests,
  };
}

export async function acceptHallJoinRequest(id, { adminNotes }) {
  try {
    const { data } = await apiClient.post(
      `/hall-join-requests/${id}/accept`,
      {
        admin_notes: adminNotes || null,
      },
      { headers: authHeaders() },
    );

    if (data.mail_error) {
      console.error("[Zones] Mail send failed:", data.mail_error);
    }

    return {
      ok: true,
      request: data.request,
      registrationUrl: data.registration_url,
      mailError: data.mail_error || null,
      mailSent: Boolean(data.mail_sent),
    };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  } finally {
    notifyHallJoinRequestsUpdated();
  }
}

export async function rejectHallJoinRequest(id, reason) {
  try {
    const { data } = await apiClient.post(
      `/hall-join-requests/${id}/reject`,
      { reason },
      { headers: authHeaders() },
    );

    return { ok: true, request: data.request };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  } finally {
    notifyHallJoinRequestsUpdated();
  }
}
