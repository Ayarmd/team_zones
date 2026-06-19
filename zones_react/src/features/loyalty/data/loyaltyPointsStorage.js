import { getSuperAdminState } from "../../super-admin/data/superAdminStorage";

const CUSTOMERS_KEY = "zones-loyalty-customers-v1";
const HISTORY_KEY = "zones-loyalty-history-v1";

export const LOYALTY_UPDATED_EVENT = "zones-loyalty-updated";

export const DEFAULT_POINTS_PER_SESSION = 20;
export const DEFAULT_REDEMPTION_THRESHOLD = 120;

function clampPositiveInt(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOYALTY_UPDATED_EVENT));
}

export function normalizePhone(phone) {
  return String(phone || "")
    .replace(/\s+/g, "")
    .replace(/^\+218/, "0")
    .replace(/\D/g, "")
    .replace(/^218/, "")
    .replace(/^0+/, "0");
}

export function getLoyaltySettings() {
  const settings = getSuperAdminState().systemSettings || {};
  return {
    pointsPerSession: clampPositiveInt(settings.loyaltyPointsPerSession, DEFAULT_POINTS_PER_SESSION),
    redemptionThreshold: clampPositiveInt(
      settings.loyaltyRedemptionThreshold,
      DEFAULT_REDEMPTION_THRESHOLD,
    ),
  };
}

function loadCustomersRaw() {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) return buildSeedCustomers();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : buildSeedCustomers();
  } catch {
    return buildSeedCustomers();
  }
}

function loadHistoryRaw() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistCustomers(customers) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  notifyUpdated();
}

function persistHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  notifyUpdated();
}

function buildSeedCustomers() {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      phoneKey: normalizePhone("0912345678"),
      phone: "0912345678",
      name: "محمد الزليطني",
      email: "",
      pointsBalance: 150,
      lifetimeEarned: 150,
      lifetimeRedeemed: 0,
      updatedAt: now,
    },
    {
      id: 2,
      phoneKey: normalizePhone("0923456789"),
      phone: "0923456789",
      name: "أحمد الفيتوري",
      email: "",
      pointsBalance: 0,
      lifetimeEarned: 30,
      lifetimeRedeemed: 30,
      updatedAt: now,
    },
    {
      id: 3,
      phoneKey: normalizePhone("0934567890"),
      phone: "0934567890",
      name: "سالم بوعزيزة",
      email: "",
      pointsBalance: 10,
      lifetimeEarned: 10,
      lifetimeRedeemed: 0,
      updatedAt: now,
    },
  ];
}

function appendHistory(entry) {
  const history = loadHistoryRaw();
  const id = history.reduce((max, row) => Math.max(max, row.id ?? 0), 0) + 1;
  const row = { id, createdAt: new Date().toISOString(), ...entry };
  persistHistory([row, ...history].slice(0, 500));
  return row;
}

export function loadLoyaltyCustomers() {
  const customers = loadCustomersRaw();
  if (!localStorage.getItem(CUSTOMERS_KEY)) {
    persistCustomers(customers);
  }
  return customers.sort((a, b) => b.pointsBalance - a.pointsBalance);
}

export function loadPointsHistory(limit = 50) {
  return loadHistoryRaw()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit);
}

export function getCustomerByPhone(phone) {
  const key = normalizePhone(phone);
  if (!key) return null;
  return loadLoyaltyCustomers().find((c) => c.phoneKey === key) ?? null;
}

export function getCustomerPointsBalance(phone) {
  return getCustomerByPhone(phone)?.pointsBalance ?? 0;
}

export function canPayWithPoints(phone) {
  const { redemptionThreshold } = getLoyaltySettings();
  return getCustomerPointsBalance(phone) >= redemptionThreshold;
}

export function getOrCreateCustomer({ phone, name = "", email = "" }) {
  const phoneKey = normalizePhone(phone);
  if (!phoneKey) return null;

  const customers = loadLoyaltyCustomers();
  const existing = customers.find((c) => c.phoneKey === phoneKey);
  if (existing) {
    if (name && !existing.name) existing.name = name;
    if (email && !existing.email) existing.email = email;
    return existing;
  }

  const id = customers.reduce((max, c) => Math.max(max, c.id ?? 0), 0) + 1;
  const customer = {
    id,
    phoneKey,
    phone: String(phone || "").trim() || phoneKey,
    name: name.trim(),
    email: email.trim(),
    pointsBalance: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    updatedAt: new Date().toISOString(),
  };
  persistCustomers([...customers, customer]);
  return customer;
}

export function redeemPointsForBooking({ phone, name = "", email = "", bookingCode = "" }) {
  const { redemptionThreshold } = getLoyaltySettings();
  const customer = getOrCreateCustomer({ phone, name, email });
  if (!customer) {
    return { ok: false, error: "رقم الهاتف مطلوب للدفع بالنقاط." };
  }
  if (customer.pointsBalance < redemptionThreshold) {
    return {
      ok: false,
      error: `رصيد النقاط غير كافٍ. تحتاج ${redemptionThreshold} نقطة على الأقل.`,
    };
  }

  const deducted = redemptionThreshold;
  const balanceAfter = Math.max(0, (customer.pointsBalance || 0) - deducted);
  const customers = loadLoyaltyCustomers().map((c) =>
    c.id === customer.id
      ? {
          ...c,
          name: name.trim() || c.name,
          email: email.trim() || c.email,
          pointsBalance: balanceAfter,
          lifetimeRedeemed: (c.lifetimeRedeemed || 0) + deducted,
          updatedAt: new Date().toISOString(),
        }
      : c,
  );
  persistCustomers(customers);

  appendHistory({
    customerId: customer.id,
    phone: customer.phone,
    customerName: name.trim() || customer.name,
    type: "redeem",
    points: -deducted,
    balanceAfter,
    bookingCode,
    note: `دفع جلسة بالنقاط — خصم ${deducted} نقطة (الحد الأدنى)`,
  });

  return { ok: true, deducted, balance: balanceAfter };
}

export function awardPointsForCompletedSession(slot) {
  if (!slot?.phone?.trim()) {
    return { ok: false, skipped: true, reason: "no_phone" };
  }
  if (slot.paymentType === "points") {
    return { ok: false, skipped: true, reason: "paid_with_points" };
  }

  const { pointsPerSession } = getLoyaltySettings();
  const customer = getOrCreateCustomer({
    phone: slot.phone,
    name: slot.visitorName,
    email: slot.email,
  });
  if (!customer) {
    return { ok: false, skipped: true, reason: "invalid_phone" };
  }

  const balanceAfter = (customer.pointsBalance || 0) + pointsPerSession;
  const customers = loadLoyaltyCustomers().map((c) =>
    c.id === customer.id
      ? {
          ...c,
          name: slot.visitorName?.trim() || c.name,
          email: slot.email?.trim() || c.email,
          pointsBalance: balanceAfter,
          lifetimeEarned: (c.lifetimeEarned || 0) + pointsPerSession,
          updatedAt: new Date().toISOString(),
        }
      : c,
  );
  persistCustomers(customers);

  appendHistory({
    customerId: customer.id,
    phone: customer.phone,
    customerName: slot.visitorName || customer.name,
    type: "earn",
    points: pointsPerSession,
    balanceAfter,
    bookingCode: slot.bookingCode || "",
    note: `إتمام جلسة — +${pointsPerSession} نقطة`,
  });

  return { ok: true, earned: pointsPerSession, balance: balanceAfter };
}

export function getLoyaltyLeaderboard(limit = 5) {
  return loadLoyaltyCustomers()
    .filter((c) => (c.lifetimeRedeemed || 0) > 0 || (c.lifetimeEarned || 0) > 0)
    .sort((a, b) => (b.lifetimeRedeemed || 0) - (a.lifetimeRedeemed || 0))
    .slice(0, limit);
}

export function historyTypeLabel(type) {
  if (type === "earn") return "اكتساب";
  if (type === "redeem") return "استبدال";
  return type;
}
