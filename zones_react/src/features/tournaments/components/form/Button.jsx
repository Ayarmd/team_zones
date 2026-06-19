import "./tournamentFormTheme.css";

export default function Button({ children, variant = "primary", type = "button", onClick, className = "" }) {
  if (variant === "secondary") {
    return (
      <button type={type} onClick={onClick} className={`tform-btn-secondary ${className}`}>
        {children}
      </button>
    );
  }
  return (
    <button type={type} onClick={onClick} className={`tform-btn-primary ${className}`}>
      {children}
    </button>
  );
}
