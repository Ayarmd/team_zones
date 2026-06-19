export const COMMISSION_PAYMENT = {
  paid: "paid",
  pending: "pending",
};

export const COMMISSION_PAYMENT_LABELS = {
  [COMMISSION_PAYMENT.paid]: "تم الدفع",
  [COMMISSION_PAYMENT.pending]: "في الانتظار",
};

export function normalizeCommissionPaymentStatus(status) {
  if (status === COMMISSION_PAYMENT.paid || status === "collected") return COMMISSION_PAYMENT.paid;
  return COMMISSION_PAYMENT.pending;
}

export function parseCommissionDueDate(dueDate) {
  const normalized = String(dueDate || "").trim().replace(/\//g, "-");
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isCommissionPaymentOverdue(dueDate, paymentStatus) {
  if (normalizeCommissionPaymentStatus(paymentStatus) === COMMISSION_PAYMENT.paid) return false;
  const due = parseCommissionDueDate(dueDate);
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}
