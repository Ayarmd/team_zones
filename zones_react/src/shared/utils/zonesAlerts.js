import Swal from "sweetalert2";
import { toast } from "react-toastify";

const BRAND = "#6B5478";

export function getAppTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function getSwalTheme() {
  const isLight = getAppTheme() === "light";
  return {
    background: isLight ? "#ffffff" : "#111827",
    color: isLight ? "#1f2937" : "#f3f4f6",
    confirmButtonColor: BRAND,
    cancelButtonColor: isLight ? "#e5e7eb" : "#374151",
    customClass: {
      popup: "zones-swal-popup",
      title: "zones-swal-title",
      htmlContainer: "zones-swal-text",
      actions: "zones-swal-actions",
      confirmButton: "zones-swal-btn zones-swal-btn--confirm",
      cancelButton: "zones-swal-btn zones-swal-btn--cancel",
      icon: "zones-swal-icon",
    },
    buttonsStyling: false,
    zIndex: 20000,
  };
}

/** للتوافق مع الملفات التي تستخدم spread */
export function getSwalBase() {
  return getSwalTheme();
}

export function zonesSwal(options = {}) {
  return Swal.fire({ ...getSwalTheme(), ...options });
}

export function zonesClose() {
  Swal.close();
}

export function zonesConfirm({
  title,
  text,
  html,
  confirmText = "نعم، متأكد",
  cancelText = "تراجع",
  danger = false,
  icon = "question",
} = {}) {
  return zonesSwal({
    title,
    text,
    html,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: danger ? "#dc2626" : BRAND,
  }).then((res) => res.isConfirmed);
}

export function zonesToastSuccess(message, title) {
  const text = title ? `${title} — ${message}` : message;
  toast.success(text, {
    className: "zones-toastify zones-toastify--success",
    bodyClassName: "zones-toastify__body",
  });
}

export function zonesToastError(message, title) {
  const text = title ? `${title} — ${message}` : message;
  toast.error(text, {
    className: "zones-toastify zones-toastify--error",
    bodyClassName: "zones-toastify__body",
  });
}

export function zonesToastInfo(message) {
  toast.info(message, {
    className: "zones-toastify zones-toastify--info",
    bodyClassName: "zones-toastify__body",
  });
}

export function zonesToastWarning(message) {
  toast.warning(message, {
    className: "zones-toastify zones-toastify--warning",
    bodyClassName: "zones-toastify__body",
  });
}

/** @deprecated استخدم zonesConfirm */
export function confirmAction(opts) {
  return zonesConfirm(opts);
}

/** @deprecated استخدم zonesToastSuccess */
export function toastSuccess(title, text) {
  zonesToastSuccess(text || title, text ? title : undefined);
  return Promise.resolve();
}

export const toastOptions = {
  position: "top-center",
  autoClose: 3200,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  rtl: true,
  theme: "colored",
};
