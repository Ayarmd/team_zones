import { ToggleLeft, ToggleRight } from "lucide-react";

/** سويتش منور — يوضح وجود عطل على الجهاز (FR-46) */
export default function FaultToggleSwitch({ checked, onChange, disabled, label }) {
  const on = checked;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label || (on ? "يوجد عطل — اضغط للتبديل" : "لا يوجد عطل — اضغط للتبديل")}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
      className={
        on
          ? "maint-fault-switch maint-fault-switch--maintenance"
          : "maint-fault-switch maint-fault-switch--healthy"
      }
    >
      {on ? (
        <ToggleRight size={28} strokeWidth={1.75} aria-hidden className="block shrink-0" />
      ) : (
        <ToggleLeft size={28} strokeWidth={1.75} aria-hidden className="block shrink-0" />
      )}
    </button>
  );
}
