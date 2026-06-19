import "./tournamentFormTheme.css";

export default function ToggleSwitch({ id, label, showAsterisk = false, checked, onChange, helperText }) {
  return (
    <div className="grid gap-2 text-end">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <label htmlFor={id} className="tform-label">
          {label}
          {showAsterisk ? <span className="ms-0.5 text-violet-400">*</span> : null}
        </label>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative h-8 w-[3.25rem] shrink-0 border-0 transition ${
            checked
              ? "bg-gradient-to-l from-violet-600 to-indigo-500 shadow-[0_0_18px_rgba(139,92,246,0.4)]"
              : "tform-toggle-track-off"
          }`}
          style={{ borderRadius: "999px" }}
        >
          <span
            className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow-md transition-all duration-200 ease-out ${
              checked ? "end-1" : "start-1"
            }`}
            style={{ borderRadius: "999px" }}
          />
        </button>
      </div>
      {helperText ? <p className="tform-helper">{helperText}</p> : null}
    </div>
  );
}
