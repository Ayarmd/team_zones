import { apiClient, mapApiErrorMessage } from "../../../shared/api/apiClient";
import { resolveMediaUrl } from "../../../shared/utils/resolveMediaUrl";
import { validateRegistrationDeadline } from "../utils/tournamentDeadlineValidation";

function formatDisplayDate(iso) {
  if (!iso) return "—";
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return iso;
  return `${day}-${m}-${y}`;
}

function toDateInput(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function mapStatus(status) {
  if (status === "ongoing") return "started";
  if (status === "completed") return "finished";
  return status || "upcoming";
}

export function mapApiTournament(row) {
  const startIso = row.start_date || row.startDate;
  const endIso = row.end_date || row.endDate;
  const deadlineIso = row.registration_deadline || row.registrationDeadline;

  return {
    id: row.id,
    name: row.title || row.name || "",
    game: row.game_name || row.game || "",
    participants: Number(row.max_participants ?? row.participants ?? 8),
    registeredCount: Number(row.participants_count ?? row.registered_participants_count ?? 0),
    startDate: formatDisplayDate(startIso),
    endDate: formatDisplayDate(endIso),
    registrationDeadline: formatDisplayDate(deadlineIso),
    startDateInput: toDateInput(startIso),
    endDateInput: toDateInput(endIso),
    registrationDeadlineInput: toDatetimeLocal(deadlineIso),
    status: mapStatus(row.status),
    prize: row.prize_summary || row.prize || "",
    delayMinutes: Number(row.delay_minutes ?? row.delayMinutes ?? 10),
    withdrawal: row.withdrawal_rule || row.withdrawal || "",
    coverImage: resolveMediaUrl(row.cover_image_url || row.coverImage || "") || null,
    matchRules: row.match_rules || "",
  };
}

function toApiPayload(form) {
  const deadlineError = validateRegistrationDeadline(form);
  if (deadlineError) {
    throw new Error(deadlineError);
  }

  const payload = {
    title: form.name?.trim(),
    game_name: form.game?.trim(),
    max_participants: Number(form.participants) || 8,
    prize_summary: form.prize?.trim() || "",
    start_date: form.startDate,
    end_date: form.endDate,
    registration_deadline: form.registrationDeadline,
    delay_minutes: Number(form.delayMinutes) || 10,
    withdrawal_rule: form.withdrawal?.trim() || null,
    match_rules: form.rules?.trim() || "",
  };

  if (form.coverDataUrl && String(form.coverDataUrl).startsWith("data:image")) {
    payload.cover_image = form.coverDataUrl;
  }

  return payload;
}

export function tournamentToForm(tournament) {
  return {
    name: tournament?.name || "",
    game: tournament?.game || "",
    participants: String(tournament?.participants ?? 8),
    startDate: tournament?.startDateInput || "",
    endDate: tournament?.endDateInput || "",
    registrationDeadline: tournament?.registrationDeadlineInput || "",
    prize: tournament?.prize || "",
    delayMinutes: String(tournament?.delayMinutes ?? 10),
    withdrawal: tournament?.withdrawal || "خسارة",
    coverDataUrl: tournament?.coverImage || null,
    rules: tournament?.matchRules || "",
  };
}

export async function fetchManagerTournaments() {
  try {
    const { data } = await apiClient.get("/manager/tournaments");
    const list = data.tournaments || [];
    return { ok: true, tournaments: list.map(mapApiTournament) };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), tournaments: [] };
  }
}

export async function fetchManagerTournament(tournamentId) {
  try {
    const { data } = await apiClient.get(`/manager/tournaments/${tournamentId}`);
    return { ok: true, tournament: mapApiTournament(data.tournament) };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function createManagerTournament(form) {
  try {
    const payload = toApiPayload(form);
    if (form.coverDataUrl) payload.cover_image = form.coverDataUrl;
    const { data } = await apiClient.post("/manager/tournaments", payload);
    return { ok: true, tournament: mapApiTournament(data.tournament), message: data.message };
  } catch (error) {
    return { ok: false, error: error.message || mapApiErrorMessage(error) };
  }
}

export async function updateManagerTournament(tournamentId, form) {
  try {
    const { data } = await apiClient.put(`/manager/tournaments/${tournamentId}`, toApiPayload(form));
    return { ok: true, tournament: mapApiTournament(data.tournament), message: data.message };
  } catch (error) {
    return { ok: false, error: error.message || mapApiErrorMessage(error) };
  }
}

export async function cancelManagerTournament(tournamentId) {
  try {
    const { data } = await apiClient.post(`/manager/tournaments/${tournamentId}/cancel`);
    return { ok: true, tournament: mapApiTournament(data.tournament), message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function fetchAllTournamentParticipantsRows() {
  try {
    const tournamentsResult = await fetchManagerTournaments();
    if (!tournamentsResult.ok) {
      return { ok: false, error: tournamentsResult.error, rows: [] };
    }

    const rows = [];
    for (const tournament of tournamentsResult.tournaments) {
      const result = await fetchTournamentParticipants(tournament.id);
      if (!result.ok) continue;

      result.participants.forEach((participant, index) => {
        rows.push({
          id: `${tournament.id}-${participant.id ?? index}`,
          slotIndex: index + 1,
          fullName: participant.name || "—",
          email: participant.email || "—",
          phone: participant.phone || "—",
          tournamentName: tournament.name,
          registeredAt: participant.registered_at || participant.registeredAt,
          isWinner: Boolean(participant.is_winner ?? participant.isWinner),
        });
      });
    }

    return { ok: true, rows };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), rows: [] };
  }
}

export async function fetchTournamentParticipants(tournamentId) {
  try {
    const { data } = await apiClient.get(`/manager/tournaments/${tournamentId}/participants`);
    return { ok: true, participants: data.participants || [] };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), participants: [] };
  }
}

export async function fetchManagerBracket(tournamentId) {
  try {
    const { data } = await apiClient.get(`/manager/tournaments/${tournamentId}/bracket`);
    return { ok: true, bracket: data.bracket || null };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), bracket: null };
  }
}

export async function updateManagerMatch(tournamentId, matchId, payload) {
  try {
    const { data } = await apiClient.patch(`/manager/tournaments/${tournamentId}/matches/${matchId}`, payload);
    return {
      ok: true,
      message: data.message,
      bracket: data.bracket || null,
      match: data.match || null,
      notificationQueued: Boolean(data.notification_queued),
    };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function notifyTournamentWinner(tournamentId) {
  try {
    const { data } = await apiClient.post(`/manager/tournaments/${tournamentId}/notify-winner`);
    return {
      ok: true,
      message: data.message,
      notificationQueued: Boolean(data.notification_queued),
    };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}
