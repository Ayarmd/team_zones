export function parsePriceNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function calcOfferPrice(packagePrice, discountPercent) {
  const base = parsePriceNumber(packagePrice);
  const pct = Math.min(100, Math.max(0, parsePriceNumber(discountPercent)));
  const discounted = base * (1 - pct / 100);
  return Math.round(discounted * 100) / 100;
}

export function formatDiscountPercent(value) {
  const n = parsePriceNumber(value);
  return `${n}%`;
}

export function formatOfferDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-LY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatOfferPrice(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  return `${n} د.ل`;
}

export function toInputDate(value) {
  if (!value) return "";
  if (value.includes("/")) return value.replace(/\//g, "-");
  return value.slice(0, 10);
}

export function fromInputDate(value) {
  if (!value) return "";
  return value.slice(0, 10);
}
