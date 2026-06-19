const VARIANTS = {
  primary: "bg-[#6B5478] text-white hover:bg-[#5a4668] shadow-sm shadow-[#6B5478]/30",
  outline:
    "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800",
  ghost: "text-[#6B5478] hover:bg-[#6B5478]/10",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  dangerOutline: "border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40",
};

const SIZES = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-4 py-2 text-xs",
  lg: "px-5 py-2.5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  children,
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={size === "lg" ? 16 : 14} /> : null}
      {children}
    </button>
  );
}
