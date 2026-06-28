import { apiClient, mapApiErrorMessage, postMultipart } from "../api/apiClient";
import { resolveMediaUrl } from "../utils/resolveMediaUrl";
import {
  getAuthSession,
  PROFILE_UPDATED_EVENT,
  setAuthSession,
} from "../../features/auth/data/mockUsersStorage";
import {
  getSuperAdminSession,
  getSuperAdminToken,
  setSuperAdminSession,
  SUPER_ADMIN_PROFILE_EVENT,
} from "../../features/super-admin/data/superAdminAuth";

function isSuperAdminContext() {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/super-admin");
}

export function syncProfileFromApi(apiUser) {
  if (!apiUser) return;

  if (isSuperAdminContext()) {
    const token = getSuperAdminToken();
    const session = getSuperAdminSession();
    if (!token || !session) return;

    setSuperAdminSession(
      {
        ...session,
        fullName: apiUser.full_name || apiUser.name || session.fullName,
        phone: apiUser.phone ?? session.phone,
        avatar: resolveMediaUrl(apiUser.profile_image || ""),
      },
      token,
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SUPER_ADMIN_PROFILE_EVENT));
    }
    return;
  }

  const session = getAuthSession();
  if (!session) return;

  const stationId = apiUser.station_id ?? apiUser.hall_id ?? session.hallId;

  setAuthSession({
    ...session,
    source: "api",
    fullName: apiUser.full_name || apiUser.name || session.fullName,
    phone: apiUser.phone ?? session.phone,
    avatar: resolveMediaUrl(apiUser.profile_image || ""),
    stationName: apiUser.station_name || apiUser.hall_name || session.stationName,
    hallId: stationId != null && stationId !== "" ? String(stationId) : session.hallId,
    joinDate: apiUser.created_at ? String(apiUser.created_at).slice(0, 10) : session.joinDate,
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  }
}

function unwrapApiUser(user) {
  if (!user) return null;
  if (user.data && typeof user.data === "object") return user.data;
  return user;
}

export async function uploadProfileAvatar(file) {
  try {
    const form = new FormData();
    form.append("avatar", file);

    const { data } = await postMultipart("/profile/avatar", form);

    const apiUser = unwrapApiUser(data.user);
    const avatarUrl = resolveMediaUrl(data.avatar_url || apiUser?.profile_image || "");

    if (apiUser) {
      syncProfileFromApi({
        ...apiUser,
        profile_image: avatarUrl || apiUser.profile_image,
      });
    }

    return {
      ok: true,
      success: data.success === true,
      user: apiUser,
      avatarUrl,
      message: data.message,
    };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function deleteProfileAvatar() {
  try {
    const { data } = await apiClient.delete("/profile/avatar");

    const apiUser = unwrapApiUser(data.user);
    if (apiUser) syncProfileFromApi(apiUser);

    return { ok: true, user: apiUser, message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}
