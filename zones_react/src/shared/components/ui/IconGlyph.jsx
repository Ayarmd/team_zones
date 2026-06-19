const TONES = {
  primary: "text-[#6B5478] dark:text-[#c4b5d0]",
  green: "text-emerald-600 dark:text-emerald-400",
  red: "text-red-600 dark:text-red-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-500 dark:text-rose-400",
  violet: "text-violet-500 dark:text-violet-400",
};

export default function IconGlyph({ icon: Icon, tone = "primary", size = 22, className = "" }) {
  if (!Icon) return null;
  return (
    <Icon
      size={size}
      strokeWidth={2}
      className={`shrink-0 ${TONES[tone] || TONES.primary} ${className}`}
    />
  );
}
