export default function StatusBadge({ active, label }) {
  if (active) {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
        {label || "نشط"}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
      {label || "معطل"}
    </span>
  );
}
