import "./tournamentFormTheme.css";

export default function InputField({
  id,
  label,
  required,
  showAsterisk,
  type = "text",
  value,
  onChange,
  placeholder,
  helperText,
  suffix,
  min,
  className = "",
  inputClassName = "",
  as = "input",
  rows,
}) {
  const showStar = showAsterisk !== false && required;
  const controlClass = as === "textarea" ? `tform-textarea ${inputClassName}` : `tform-input ${inputClassName}`;

  const control =
    as === "textarea" ? (
      <textarea
        id={id}
        rows={rows ?? 3}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={controlClass}
      />
    ) : (
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        required={required}
        className={controlClass}
      />
    );

  return (
    <div className={`grid gap-2 text-end ${className}`}>
      <label htmlFor={id} className="tform-label">
        {label}
        {showStar ? <span className="ms-0.5 text-violet-400">*</span> : null}
      </label>
      {suffix ? (
        <div className="flex items-stretch gap-2">
          {control}
          <span className="tform-suffix">{suffix}</span>
        </div>
      ) : (
        control
      )}
      {helperText ? <p className="tform-helper">{helperText}</p> : null}
    </div>
  );
}
