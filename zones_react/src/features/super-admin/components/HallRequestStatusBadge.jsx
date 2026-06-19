import { HALL_REQUEST_STATUS, HALL_REQUEST_STATUS_LABELS, normalizeHallRequestStatus } from "../data/hallRequestStatus";

const STYLES = {
  [HALL_REQUEST_STATUS.pending]: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  [HALL_REQUEST_STATUS.accepted]: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  [HALL_REQUEST_STATUS.rejected]: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export default function HallRequestStatusBadge({ status }) {
  const key = normalizeHallRequestStatus(status);
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STYLES[key]}`}>
      {HALL_REQUEST_STATUS_LABELS[key]}
    </span>
  );
}
