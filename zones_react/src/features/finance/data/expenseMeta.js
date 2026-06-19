export const EXPENSE_CATEGORIES = [
  { id: "rent", label: "إيجار مكان" },
  { id: "internet", label: "اشتراك نت" },
  { id: "maintenance", label: "صيانة جهاز" },
  { id: "electricity", label: "فواتير كهرباء" },
  { id: "cleaning", label: "مصروف نظافة" },
];

export const EXPENSE_CATEGORY_COLORS = {
  rent: "#6B5478",
  internet: "#3b82f6",
  maintenance: "#f97316",
  electricity: "#eab308",
  cleaning: "#22c55e",
};

export function categoryLabel(id) {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id ?? "—";
}

export function paymentStatusLabel(isPaid) {
  return isPaid ? "مدفوع" : "غير مدفوع";
}

export function formatExpenseDate(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const p = iso.split("-");
  if (p.length !== 3) return iso;
  const [y, m, d] = p;
  return `${d}-${m}-${y}`;
}

export function formatExpenseAmount(amount) {
  return `${new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 0 }).format(Math.round(amount || 0))} د.ل`;
}
