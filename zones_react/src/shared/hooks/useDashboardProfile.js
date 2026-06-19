import { useCallback, useEffect, useState } from "react";
import { getAuthSession, AUTH_SESSION_EVENT, PROFILE_UPDATED_EVENT } from "../../features/auth/data/mockUsersStorage";
import { EMPLOYEES_STORAGE_EVENT } from "../../features/employees/data/employeesStorage";
import { SUPER_ADMIN_PROFILE_EVENT } from "../../features/super-admin/data/superAdminAuth";
import { resolveDashboardProfile } from "../utils/resolveDashboardProfile";

/** اسم وصورة المستخدم الحالي فقط — حسب حسابه في التخزين وليس جلسة مشتركة خاطئة */
export function useDashboardProfile({ superAdmin = false } = {}) {
  const read = useCallback(
    () => resolveDashboardProfile(superAdmin ? null : getAuthSession(), { superAdmin }),
    [superAdmin],
  );

  const [profile, setProfile] = useState(read);

  useEffect(() => {
    setProfile(read());
  }, [read]);

  useEffect(() => {
    const refresh = () => setProfile(read());
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);
    window.addEventListener(AUTH_SESSION_EVENT, refresh);
    window.addEventListener(EMPLOYEES_STORAGE_EVENT, refresh);
    window.addEventListener(SUPER_ADMIN_PROFILE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
      window.removeEventListener(AUTH_SESSION_EVENT, refresh);
      window.removeEventListener(EMPLOYEES_STORAGE_EVENT, refresh);
      window.removeEventListener(SUPER_ADMIN_PROFILE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [read]);

  return profile;
}
