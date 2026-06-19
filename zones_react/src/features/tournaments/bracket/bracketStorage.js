import { createEmptyBracket, normalizeBracketRounds, shuffleRandom } from "./bracketUtils";
import { loadTournamentRows } from "../tournamentsListStorage";
import {
  getParticipantNamesForTournament,
  isTournamentParticipantsFull,
} from "../data/tournamentParticipantsStorage";

const PREFIX = "zones-bracket-v1-";

function bracketKey(tournamentId) {
  return PREFIX + tournamentId;
}

function migrateBracketFromSession(tournamentId) {
  const key = bracketKey(tournamentId);
  if (localStorage.getItem(key)) return;
  const legacy = sessionStorage.getItem(key);
  if (legacy) {
    localStorage.setItem(key, legacy);
    sessionStorage.removeItem(key);
  }
}

export function loadBracketState(tournamentId) {
  migrateBracketFromSession(tournamentId);
  try {
    const raw = localStorage.getItem(bracketKey(tournamentId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveBracketState(tournamentId, state) {
  try {
    localStorage.setItem(bracketKey(tournamentId), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function isBracketReady(tournament) {
  if (!tournament) return false;
  return isTournamentParticipantsFull(tournament.id, tournament.participants);
}

export function seedBracketFromParticipants(tournament, playerNames = null) {
  const names = playerNames ?? getParticipantNamesForTournament(tournament.id);
  if (names.length < tournament.participants) return null;

  const fresh = createEmptyBracket(
    { ...tournament, registeredPlayers: names },
    { realOnly: true, playerNames: names },
  );
  if (!fresh) return null;
  saveBracketState(tournament.id, fresh);
  return fresh;
}

export function generateTournamentBracket(tournament) {
  if (!tournament?.id) return { ok: false, error: "بطولة غير صالحة." };
  if (tournament.isArchived) return { ok: false, error: "البطولة مؤرشفة." };
  if (tournament.status === "cancelled") return { ok: false, error: "البطولة ملغاة." };
  if (!isTournamentParticipantsFull(tournament.id, tournament.participants)) {
    return { ok: false, error: "لم يكتمل عدد المشاركين بعد." };
  }

  const names = getParticipantNamesForTournament(tournament.id);
  if (names.length < tournament.participants) {
    return { ok: false, error: "عدد المسجّلين أقل من سعة البطولة." };
  }

  clearBracketStorage(tournament.id);
  const shuffled = shuffleRandom(names);
  const fresh = createEmptyBracket(
    { ...tournament, registeredPlayers: shuffled },
    { realOnly: true, playerNames: shuffled },
  );
  if (!fresh) return { ok: false, error: "تعذر إنشاء شجرة البطولة." };

  saveBracketState(tournament.id, fresh);
  return { ok: true, bracket: fresh };
}

export function hasGeneratedBracket(tournamentId) {
  const state = loadBracketState(tournamentId);
  return Boolean(state?.rounds?.length);
}

export function getOrCreateBracketState(tournament) {
  if (!isBracketReady(tournament)) return null;

  const existing = loadBracketState(tournament.id);
  if (existing && existing.rounds?.length) {
    normalizeBracketRounds(existing.rounds);
    saveBracketState(tournament.id, existing);
    return existing;
  }

  return seedBracketFromParticipants(tournament);
}

function clearBracketStorage(tournamentId) {
  try {
    localStorage.removeItem(bracketKey(tournamentId));
    sessionStorage.removeItem(bracketKey(tournamentId));
  } catch {
    /* ignore */
  }
}

export function resetBracketForTournament(tournamentId) {
  clearBracketStorage(tournamentId);
  const list = loadTournamentRows();
  const t = list.find((x) => x.id === tournamentId);
  if (!t || !isBracketReady(t)) return null;
  return seedBracketFromParticipants(t);
}
