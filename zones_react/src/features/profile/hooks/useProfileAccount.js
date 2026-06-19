import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  zonesConfirm,
  zonesSwal,
  zonesToastError,
  zonesToastSuccess,
} from "../../../shared/utils/zonesAlerts";
import {
  changeUserPassword,
  clearAuthSession,
  deleteUserAccount,
  getAuthSession,
  getLoginRedirectPath,
  getUserById,
  restoreManagerSessionFromStore,
  sessionMatchesRoleHint,
  updateUserProfile,
  verifyCurrentPassword,
} from "../../auth/data/mockUsersStorage";

/** منطق الملف الشخصي — منفصل لكل دور (مدير / صيانة) */
export function useProfileAccount(roleHint) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const loadUser = useCallback(() => {
    const current = getAuthSession();
    if (!current?.id) {
      setLoading(false);
      return;
    }
    let u = getUserById(current.id);
    if (!u) {
      u = {
        id: current.id,
        email: current.email,
        fullName: current.fullName,
        role: current.role,
        phone: current.phone || "",
        avatar: current.avatar || "",
        password: "",
        employeeId: current.employeeId ?? null,
      };
    }
    if (!u) {
      setLoading(false);
      return;
    }
    setUser(u);
    setFullName(u.fullName || "");
    setEmail(u.email || "");
    setPhone(u.phone || "");
    setAvatar(u.avatar || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = getAuthSession();
    if (!active && roleHint === "manager") {
      active = restoreManagerSessionFromStore();
    }
    if (!active) {
      navigate("/auth/login", {
        replace: true,
        state: { from: window.location.pathname },
      });
      return;
    }
    if (roleHint && !sessionMatchesRoleHint(active, roleHint)) {
      navigate(getLoginRedirectPath(active.role), { replace: true });
      return;
    }
    loadUser();
  }, [roleHint, navigate, loadUser]);

  const flash = (type, text) => {
    setMsg({ type, text });
    window.setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const onAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      flash("err", "حجم الصورة يجب أن يكون أقل من 2 ميجابايت.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    if (!user) return;
    const res = updateUserProfile(user.id, { fullName, email, phone, avatar });
    if (!res.ok) {
      flash("err", res.error);
      return;
    }
    setUser(res.user);
    flash("ok", "تم حفظ بيانات الملف الشخصي.");
  };

  const openChangePasswordFlow = async () => {
    if (!user) return;

    const step1 = await zonesSwal({
      title: "تغيير كلمة المرور",
      text: "أدخل الرمز الحالي للتحقق",
      input: "password",
      inputPlaceholder: "الرمز الحالي",
      inputAttributes: { autocomplete: "current-password", dir: "ltr" },
      showCancelButton: true,
      confirmButtonText: "متابعة",
      cancelButtonText: "إلغاء",
      inputValidator: (v) => (!v ? "أدخل الرمز الحالي" : undefined),
    });
    if (!step1.isConfirmed || !step1.value) return;

    const verify = verifyCurrentPassword(user.id, step1.value);
    if (!verify.ok) {
      zonesToastError(verify.error);
      return;
    }

    const step2 = await zonesSwal({
      title: "الرمز الجديد",
      text: "أدخل كلمة المرور الجديدة",
      input: "password",
      inputPlaceholder: "الرمز الجديد",
      inputAttributes: { autocomplete: "new-password", dir: "ltr" },
      showCancelButton: true,
      confirmButtonText: "متابعة",
      cancelButtonText: "إلغاء",
      inputValidator: (v) => (v && v.length >= 4 ? undefined : "4 أحرف على الأقل"),
    });
    if (!step2.isConfirmed || !step2.value) return;

    const step3 = await zonesSwal({
      title: "تأكيد الرمز الجديد",
      text: "أعد إدخال كلمة المرور الجديدة",
      input: "password",
      inputPlaceholder: "تأكيد الرمز",
      inputAttributes: { autocomplete: "new-password", dir: "ltr" },
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
      inputValidator: (v) => (v && v.length >= 4 ? undefined : "4 أحرف على الأقل"),
    });
    if (!step3.isConfirmed || !step3.value) return;

    if (step2.value !== step3.value) {
      zonesToastError("تأكيد الرمز غير متطابق.");
      return;
    }

    const res = changeUserPassword(user.id, step1.value, step2.value);
    if (!res.ok) {
      zonesToastError(res.error);
      return;
    }
    zonesToastSuccess("تم تغيير كلمة المرور");
  };

  const onDeleteAccount = async () => {
    if (!user) return;

    const confirmed = await zonesConfirm({
      title: "هل تريد حذف حسابك فعلاً؟",
      text: "لا يمكن التراجع عن هذا الإجراء.",
      icon: "warning",
      confirmText: "نعم، احذف الحساب",
      cancelText: "إلغاء",
      danger: true,
    });
    if (!confirmed) return;

    const { value: password } = await zonesSwal({
      title: "تأكيد الحذف",
      text: "أدخل الرمز الحالي لحذف الحساب",
      input: "password",
      inputPlaceholder: "الرمز الحالي",
      inputAttributes: { autocomplete: "current-password", dir: "ltr" },
      showCancelButton: true,
      confirmButtonText: "حذف نهائياً",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#dc2626",
      inputValidator: (v) => (!v ? "أدخل الرمز" : undefined),
    });
    if (!password) return;

    const res = deleteUserAccount(user.id, password);
    if (!res.ok) {
      zonesToastError(res.error);
      return;
    }
    clearAuthSession();
    navigate("/auth/login", {
      replace: true,
      state: { message: "تم حذف حسابك." },
    });
  };

  return {
    user,
    loading,
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    avatar,
    msg,
    onAvatarPick,
    saveProfile,
    openChangePasswordFlow,
    onDeleteAccount,
  };
}
