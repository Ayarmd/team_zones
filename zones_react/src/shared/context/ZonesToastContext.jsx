import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/ZonesToast.css";

const ZonesToastContext = createContext(null);

export function ZonesToastProvider({ children }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const hideToast = useCallback(() => setToast(null), []);

  const showInviteSentToast = useCallback(
    (onNavigate) => {
      setToast({
        message: "تم إرسال الدعوة! اضغط هنا لمحاكاة دخول الموظف",
        onClick: () => {
          hideToast();
          if (onNavigate) onNavigate();
          else navigate("/accept-invitation");
        },
      });
      window.setTimeout(hideToast, 12000);
    },
    [hideToast, navigate],
  );

  const value = useMemo(
    () => ({ showInviteSentToast, hideToast }),
    [showInviteSentToast, hideToast],
  );

  return (
    <ZonesToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="zones-toast-root" role="status" aria-live="polite">
          <button type="button" className="zones-toast zones-toast--neon" onClick={toast.onClick}>
            <span className="zones-toast__icon" aria-hidden>
              ✉
            </span>
            <span className="zones-toast__text">{toast.message}</span>
            <span className="zones-toast__hint">اضغط للمتابعة ←</span>
          </button>
          <button type="button" className="zones-toast__dismiss" onClick={hideToast} aria-label="إغلاق">
            ×
          </button>
        </div>
      ) : null}
    </ZonesToastContext.Provider>
  );
}

export function useZonesToast() {
  const ctx = useContext(ZonesToastContext);
  if (!ctx) throw new Error("useZonesToast must be used within ZonesToastProvider");
  return ctx;
}
