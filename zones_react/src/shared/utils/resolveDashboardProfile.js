import { getAuthSession, getUserById } from "../../features/auth/data/mockUsersStorage";
import { getSuperAdminSession } from "../../features/super-admin/data/superAdminAuth";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face";

/** اسم وصورة الشريط العلوي — من حساب المستخدم فقط (zones-mock-users) */
export function resolveDashboardProfile(_sessionInput, { superAdmin = false } = {}) {
  if (superAdmin) {
    const admin = getSuperAdminSession();
    return {
      fullName: admin?.fullName?.trim() || "مدير النظام",
      avatar: admin?.avatar?.trim() || DEFAULT_AVATAR,
    };
  }

  const session = getAuthSession();
  if (!session?.id) {
    return { fullName: "", avatar: DEFAULT_AVATAR };
  }

  const user = getUserById(session.id);
  if (user) {
    return {
      fullName: user.fullName?.trim() || "",
      avatar: user.avatar?.trim() || DEFAULT_AVATAR,
    };
  }

  return {
    fullName: session.fullName?.trim() || "",
    avatar: session.avatar?.trim() || DEFAULT_AVATAR,
  };
}

export function resolveDashboardAvatar(options) {
  return resolveDashboardProfile(null, options).avatar;
}
