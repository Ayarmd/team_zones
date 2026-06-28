import { apiClient, mapApiErrorMessage } from "../../../shared/api/apiClient";
import { syncProfileFromApi } from "../../../shared/api/profileAvatarApi";
import { getAuthSession } from "./mockUsersStorage";

export function isApiStaffSession(session = getAuthSession()) {
  if (!session || session.source !== "api") return false;
  return ["manager", "reception", "maintenance"].includes(session.role);
}

export const syncStaffProfileSession = syncProfileFromApi;

export async function fetchStaffProfile() {
  try {
    const { data } = await apiClient.get("/profile");
    if (data.user) syncStaffProfileSession(data.user);
    return { ok: true, user: data.user };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function updateStaffProfile({ fullName, phone }) {
  try {
    const body = {};
    if (fullName != null) body.full_name = fullName;
    if (phone != null) body.phone = phone;

    const { data } = await apiClient.put("/profile/update", body);
    if (data.user) syncStaffProfileSession(data.user);
    return { ok: true, user: data.user, message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function changeStaffPassword(currentPassword, newPassword) {
  const session = getAuthSession();
  if (!session?.token) {
    return { ok: false, error: "لا توجد جلسة نشطة." };
  }
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل." };
  }

  try {
    await apiClient.put("/profile/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    });
    return { ok: true };
  } catch (error) {
    const message = mapApiErrorMessage(error);
    if (message.toLowerCase().includes("current password") || message.includes("الحالية")) {
      return { ok: false, error: "كلمة المرور الحالية غير صحيحة." };
    }
    return { ok: false, error: message };
  }
}
