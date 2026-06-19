import "./tournamentFormTheme.css";

export default function FieldCard({ children, className = "" }) {
  return <div className={`tform-field-card sm:p-4 ${className}`}>{children}</div>;
}
