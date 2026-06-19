export const ALERT_TARGET_CATEGORIES = [
  { value: "reception", label: "موظف استقبال", shortLabel: "موظف استقبال" },
  { value: "maintenance", label: "موظف صيانة", shortLabel: "موظف صيانة" },
  { value: "customer", label: "زبون", shortLabel: "زبون" },
  { value: "all", label: "جميع", shortLabel: "جميع" },
];

export const ALERT_STATUSES = [
  { value: "active", label: "نشط" },
  { value: "stopped", label: "متوقف" },
];

export const ALERT_SEVERITY_LEVELS = [
  { value: "low", label: "منخفض", badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  { value: "medium", label: "متوسط", badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  { value: "high", label: "مرتفع", badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  { value: "critical", label: "حرج", badgeClass: "bg-red-500/15 text-red-600 dark:text-red-400" },
];

export function normalizeTargetCategories(value) {
  if (Array.isArray(value)) {
    const list = value.filter(Boolean);
    return list.length ? list : ["all"];
  }
  if (typeof value === "string" && value.trim()) {
    if (value === "employees") return ["reception", "maintenance"];
    if (value === "visitors") return ["customer"];
    return [value];
  }
  return ["all"];
}

export function alertTargetLabel(value) {
  const list = normalizeTargetCategories(value);
  if (list.includes("all")) return "جميع";
  const labels = list
    .map((v) => ALERT_TARGET_CATEGORIES.find((c) => c.value === v)?.shortLabel ?? v)
    .filter(Boolean);
  return labels.length ? labels.join("، ") : "—";
}

export function toggleTargetCategorySelection(current, value) {
  const list = normalizeTargetCategories(current);
  if (value === "all") return ["all"];
  const withoutAll = list.filter((v) => v !== "all");
  const next = withoutAll.includes(value)
    ? withoutAll.filter((v) => v !== value)
    : [...withoutAll, value];
  return next.length ? next : ["all"];
}

export function alertStatusLabel(value) {
  return ALERT_STATUSES.find((s) => s.value === value)?.label ?? "—";
}

export function alertSeverityLabel(value) {
  return ALERT_SEVERITY_LEVELS.find((s) => s.value === value)?.label ?? "—";
}

export function alertSeverityMeta(value) {
  return ALERT_SEVERITY_LEVELS.find((s) => s.value === value) ?? ALERT_SEVERITY_LEVELS[1];
}

export function formatAlertDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-LY", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAlertRecordCode(id) {
  return `T-${String(id ?? 0).padStart(4, "0")}`;
}
