import "./tournamentFormTheme.css";

export default function DateInput({ id, label, required, showAsterisk, value, onChange, placeholder }) {
  const showStar = showAsterisk !== false && required;
  return (
    <div className="grid gap-2 text-end">
      <label htmlFor={id} className="tform-label">
        {label}
        {showStar ? <span className="ms-0.5 text-violet-400">*</span> : null}
      </label>
      <input
        id={id}
        type="date"
        required={required}
        value={value}
        onChange={onChange}
        className="tform-input"
      />
      {placeholder ? <p className="tform-helper">{placeholder}</p> : null}
    </div>
  );
}
