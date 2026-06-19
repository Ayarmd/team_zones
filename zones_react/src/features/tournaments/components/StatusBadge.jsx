const variants = {
  started: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/25",
  upcoming: "bg-amber-500/15 text-amber-200 ring-amber-400/25",
  finished: "bg-slate-500/15 text-slate-200 ring-slate-400/20",
  cancelled: "bg-rose-500/12 text-rose-200 ring-rose-400/25",
};

const labels = {
  started: "بدأت",
  upcoming: "قادمة",
  finished: "انتهت",
  cancelled: "ملغاة",
};

export default function StatusBadge({ status }) {
  const cls = variants[status] ?? "bg-slate-500/15 text-slate-200 ring-slate-400/20";
  const text = labels[status] ?? status;
  const known = Boolean(variants[status]);
  return (
    <span
      data-status={known ? status : undefined}
      className={`tournament-status-badge inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {text}
    </span>
  );
}
