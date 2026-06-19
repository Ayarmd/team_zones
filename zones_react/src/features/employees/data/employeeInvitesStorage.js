const INVITES_KEY = "zones-employee-invites";

function loadInvites() {
  try {
    const raw = localStorage.getItem(INVITES_KEY);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveInvites(list) {
  try {
    localStorage.setItem(INVITES_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function makeToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmployeeInvite(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const invites = loadInvites();
  const token = makeToken();
  const invite = {
    token,
    email: normalized,
    status: "pending",
    createdAt: new Date().toISOString(),
    usedAt: null,
  };
  invites.push(invite);
  saveInvites(invites);
  return invite;
}

export function getInviteByToken(token) {
  return loadInvites().find((i) => i.token === token && i.status === "pending") ?? null;
}

export function markInviteUsed(token) {
  const invites = loadInvites().map((i) =>
    i.token === token ? { ...i, status: "used", usedAt: new Date().toISOString() } : i,
  );
  saveInvites(invites);
}

export function buildInviteUrl(token) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/employees/invite/${token}`;
}
