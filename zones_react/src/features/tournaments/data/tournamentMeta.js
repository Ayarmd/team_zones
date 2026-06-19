const STATUS_LABELS = {
  started: "بدأت",
  upcoming: "قادمة",
  finished: "انتهت",
  cancelled: "ملغاة",
  archived: "مؤرشفة",
};

export function tournamentStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "—";
}

const BANNER_FALLBACK =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80";

export function tournamentCoverImage(tournament) {
  return tournament?.coverImage || BANNER_FALLBACK;
}
