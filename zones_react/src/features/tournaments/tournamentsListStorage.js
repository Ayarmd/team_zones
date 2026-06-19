export const TOURNAMENTS_LIST_KEY = "zones-tournaments-list-v1";

export const TOURNAMENTS_LIST_EVENT = "zones-tournaments-list-updated";

function notifyTournamentsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOURNAMENTS_LIST_EVENT));
}

const defaultRows = [
  {
    id: 1,
    name: "بطولة فيفا الرمضانية",
    game: "FIFA 24",
    participants: 8,
    startDate: "20-05-2024",
    endDate: "30-05-2024",
    prize: "500 د.ل",
    status: "started",
    withdrawal: "خسارة",
    tieRule: "يتم ترحيل المباراة للمراجعة",
    delayMinutes: 10,
  },
  {
    id: 2,
    name: "بطولة تحدي الأبطال",
    game: "FIFA 24",
    participants: 16,
    startDate: "25-05-2024",
    endDate: "10-06-2024",
    prize: "300 د.ل",
    status: "upcoming",
    withdrawal: "خسارة",
    tieRule: "إعادة المباراة",
    delayMinutes: 15,
  },
  {
    id: 3,
    name: "كأس عالم 26",
    game: "FIFA 24",
    participants: 8,
    startDate: "01-06-2024",
    endDate: "15-06-2024",
    prize: "400 د.ل",
    status: "upcoming",
    withdrawal: "خسارة",
    tieRule: "إعادة المباراة",
    delayMinutes: 10,
  },
];

function normalizeRow(row) {
  return {
    ...row,
    isArchived: Boolean(row.isArchived),
    archivedAt: row.archivedAt || null,
  };
}

export function loadTournamentRows() {
  try {
    const raw = localStorage.getItem(TOURNAMENTS_LIST_KEY);
    if (!raw) return defaultRows.map(normalizeRow);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed.map(normalizeRow) : defaultRows.map(normalizeRow);
  } catch {
    return defaultRows.map(normalizeRow);
  }
}

export function loadActiveTournamentRows() {
  return loadTournamentRows().filter((r) => !r.isArchived);
}

export function archiveTournamentRow(rows, id) {
  const now = new Date().toISOString();
  return rows.map((r) =>
    r.id === id ? { ...r, isArchived: true, archivedAt: now, status: "archived" } : r,
  );
}

export function saveTournamentRows(rows) {
  try {
    const encoded = JSON.stringify(rows);
    if (encoded.length > 4_800_000) return false;
    const prev = localStorage.getItem(TOURNAMENTS_LIST_KEY);
    if (prev === encoded) return true;
    localStorage.setItem(TOURNAMENTS_LIST_KEY, encoded);
    notifyTournamentsUpdated();
    return true;
  } catch {
    return false;
  }
}
