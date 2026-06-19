const PENDING_KEY = "zones-pending-employee-invite";

export function savePendingInvite({ email, role, shift }) {
  const payload = {
    email: String(email || "")
      .trim()
      .toLowerCase(),
    role: role || "reception",
    shift: shift || "morning",
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  return payload;
}

export function getPendingInvite() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || parsed.status !== "pending") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingInvite() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}
