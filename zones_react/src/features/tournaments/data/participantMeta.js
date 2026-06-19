export function formatParticipantDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-LY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function winnerLabel(isWinner) {
  return isWinner ? "فائز" : "لا";
}
