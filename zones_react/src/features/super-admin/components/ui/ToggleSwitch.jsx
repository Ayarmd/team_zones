export default function ToggleSwitch({ checked, onChange, label, id, disabled = false }) {
  const inputId = id || `toggle-${label}`;
  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-center gap-2 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span className="relative inline-flex h-6 w-11 items-center">
        <input
          id={inputId}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => {
            if (!disabled) onChange(e.target.checked);
          }}
        />
        <span className="absolute inset-0 rounded-full bg-gray-300 transition peer-checked:bg-[#6B5478] dark:bg-gray-600" />
        <span className="absolute start-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" />
      </span>
      {label ? <span className="text-xs font-bold">{label}</span> : null}
    </label>
  );
}
