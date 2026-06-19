import { loadTournamentRows } from "../tournamentsListStorage";

const STORAGE_KEY = "zones-tournament-participants-v1";

export const TOURNAMENT_PARTICIPANTS_EVENT = "zones-tournament-participants-updated";

function notifyUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOURNAMENT_PARTICIPANTS_EVENT));
}

function normalizeParticipant(row, fallbackSlot) {
  return {
    ...row,
    slotIndex: Number(row.slotIndex) || fallbackSlot,
    isWinner: Boolean(row.isWinner),
  };
}

/** مشتركون تجريبيون — يُضافون تلقائياً عند الاشتراك من التطبيق */
const DEFAULT_PARTICIPANTS = [
  {
    id: 1,
    fullName: "أحمد المنصوري",
    email: "ahmed.m@email.com",
    phone: "0912345678",
    tournamentId: 1,
    tournamentName: "بطولة فيفا الرمضانية",
    slotIndex: 1,
    registeredAt: "2026-05-18T10:30:00",
    isWinner: false,
  },
  {
    id: 2,
    fullName: "محمد العريفي",
    email: "mohamed.a@email.com",
    phone: "0923456789",
    tournamentId: 1,
    tournamentName: "بطولة فيفا الرمضانية",
    slotIndex: 2,
    registeredAt: "2026-05-19T14:15:00",
    isWinner: false,
  },
  {
    id: 3,
    fullName: "خالد الزاوي",
    email: "khaled.z@email.com",
    phone: "0934567890",
    tournamentId: 2,
    tournamentName: "بطولة تحدي الأبطال",
    slotIndex: 1,
    registeredAt: "2026-05-20T09:00:00",
    isWinner: false,
  },
  {
    id: 4,
    fullName: "عمر بن حسين",
    email: "omar.h@email.com",
    phone: "0945678901",
    tournamentId: 2,
    tournamentName: "بطولة تحدي الأبطال",
    slotIndex: 2,
    registeredAt: "2026-05-21T16:45:00",
    isWinner: false,
  },
  {
    id: 5,
    fullName: "يوسف القاضي",
    email: "youssef.q@email.com",
    phone: "0956789012",
    tournamentId: 1,
    tournamentName: "بطولة فيفا الرمضانية",
    slotIndex: 3,
    registeredAt: "2026-05-22T11:20:00",
    isWinner: false,
  },
  {
    id: 6,
    fullName: "سالم بوزريبة",
    email: "salem.b@email.com",
    phone: "0967890123",
    tournamentId: 1,
    tournamentName: "بطولة فيفا الرمضانية",
    slotIndex: 4,
    registeredAt: "2026-05-23T08:50:00",
    isWinner: false,
  },
  {
    id: 7,
    fullName: "طارق المصراتي",
    email: "tariq.m@email.com",
    phone: "0978901234",
    tournamentId: 1,
    tournamentName: "بطولة فيفا الرمضانية",
    slotIndex: 5,
    registeredAt: "2026-05-24T13:10:00",
    isWinner: false,
  },
  {
    id: 8,
    fullName: "إبراهيم الشريف",
    email: "ibrahim.s@email.com",
    phone: "0989012345",
    tournamentId: 1,
    tournamentName: "بطولة فيفا الرمضانية",
    slotIndex: 6,
    registeredAt: "2026-05-25T17:30:00",
    isWinner: false,
  },
  {
    id: 9,
    fullName: "حسام الفيتوري",
    email: "hussam.f@email.com",
    phone: "0990123456",
    tournamentId: 1,
    tournamentName: "بطولة فيفا الرمضانية",
    slotIndex: 7,
    registeredAt: "2026-05-26T12:00:00",
    isWinner: false,
  },
  {
    id: 10,
    fullName: "نادر الجهاني",
    email: "nader.j@email.com",
    phone: "0911223344",
    tournamentId: 1,
    tournamentName: "بطولة فيفا الرمضانية",
    slotIndex: 8,
    registeredAt: "2026-05-27T19:25:00",
    isWinner: false,
  },
  {
    id: 11,
    fullName: "فهد العكاري",
    email: "fahd.a@email.com",
    phone: "0912334455",
    tournamentId: 2,
    tournamentName: "بطولة تحدي الأبطال",
    slotIndex: 3,
    registeredAt: "2026-05-28T10:00:00",
    isWinner: false,
  },
  {
    id: 12,
    fullName: "مازن الشريف",
    email: "mazen.s@email.com",
    phone: "0923445566",
    tournamentId: 2,
    tournamentName: "بطولة تحدي الأبطال",
    slotIndex: 4,
    registeredAt: "2026-05-28T11:00:00",
    isWinner: false,
  },
  {
    id: 13,
    fullName: "رامي بوخزام",
    email: "rami.b@email.com",
    phone: "0934556677",
    tournamentId: 3,
    tournamentName: "كأس عالم 26",
    slotIndex: 1,
    registeredAt: "2026-06-01T09:00:00",
    isWinner: false,
  },
  {
    id: 14,
    fullName: "وليد المنفي",
    email: "walid.m@email.com",
    phone: "0945667788",
    tournamentId: 3,
    tournamentName: "كأس عالم 26",
    slotIndex: 2,
    registeredAt: "2026-06-01T10:00:00",
    isWinner: false,
  },
];

export function loadTournamentParticipants() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PARTICIPANTS.map((p, i) => normalizeParticipant(p, i + 1));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return DEFAULT_PARTICIPANTS.map((p, i) => normalizeParticipant(p, i + 1));
    }
    return parsed.map((p, i) => normalizeParticipant(p, i + 1));
  } catch {
    return DEFAULT_PARTICIPANTS.map((p, i) => normalizeParticipant(p, i + 1));
  }
}

export function saveTournamentParticipants(list) {
  try {
    const encoded = JSON.stringify(list);
    const prev = localStorage.getItem(STORAGE_KEY);
    if (prev === encoded) return;
    localStorage.setItem(STORAGE_KEY, encoded);
    notifyUpdated();
  } catch {
    /* ignore */
  }
}

export function getTournamentCapacity(tournamentId) {
  const t = loadTournamentRows().find((r) => r.id === tournamentId);
  return Math.max(2, Number(t?.participants) || 8);
}

export function getParticipantsByTournamentId(tournamentId, list = loadTournamentParticipants()) {
  return list
    .filter((p) => p.tournamentId === tournamentId)
    .sort((a, b) => a.slotIndex - b.slotIndex);
}

export function countParticipantsForTournament(tournamentId, list = loadTournamentParticipants()) {
  return getParticipantsByTournamentId(tournamentId, list).length;
}

export function isTournamentParticipantsFull(tournamentId, capacity = getTournamentCapacity(tournamentId)) {
  return countParticipantsForTournament(tournamentId) >= capacity;
}

export function getParticipantNamesForTournament(tournamentId) {
  return getParticipantsByTournamentId(tournamentId).map((p) => p.fullName);
}

export function buildTournamentSlotGrid(tournamentId, capacity = getTournamentCapacity(tournamentId)) {
  const participants = getParticipantsByTournamentId(tournamentId);
  const bySlot = new Map(participants.map((p) => [p.slotIndex, p]));
  const slots = [];
  for (let i = 1; i <= capacity; i += 1) {
    slots.push({
      slotIndex: i,
      participant: bySlot.get(i) ?? null,
    });
  }
  return slots;
}

export function getTournamentFilterOptions(participants = []) {
  const names = [...new Set(participants.map((p) => p.tournamentName).filter(Boolean))];
  return names.sort((a, b) => a.localeCompare(b, "ar"));
}

/** يُستدعى من التطبيق عند اشتراك جديد في بطولة */
export function addTournamentParticipant(entry) {
  const list = loadTournamentParticipants();
  const tournamentId = entry.tournamentId;
  const capacity = getTournamentCapacity(tournamentId);
  const existing = getParticipantsByTournamentId(tournamentId, list);

  if (existing.length >= capacity) {
    return { ok: false, error: "البطولة مكتملة — لا يمكن قبول مشتركين جدد." };
  }

  const nextSlot = existing.length + 1;
  const nid = Math.max(0, ...list.map((p) => p.id)) + 1;
  const participant = normalizeParticipant(
    {
      id: nid,
      isWinner: false,
      registeredAt: new Date().toISOString(),
      slotIndex: nextSlot,
      ...entry,
    },
    nextSlot,
  );

  const next = [...list, participant];
  saveTournamentParticipants(next);

  return { ok: true, participant, slotIndex: nextSlot, isFull: nextSlot >= capacity };
}
