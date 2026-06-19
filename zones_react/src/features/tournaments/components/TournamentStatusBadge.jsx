import { tournamentStatusLabel } from "../data/tournamentMeta";

const styles = {
  started: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  upcoming: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  finished: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
  archived: "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

export default function TournamentStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${styles[status] || "bg-gray-200 text-gray-500"}`}
    >
      {tournamentStatusLabel(status)}
    </span>
  );
}
