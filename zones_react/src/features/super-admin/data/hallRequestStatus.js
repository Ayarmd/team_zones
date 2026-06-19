export const HALL_REQUEST_STATUS = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
};

export const HALL_REQUEST_STATUS_LABELS = {
  pending: "معلقة",
  accepted: "مقبول",
  rejected: "مرفوض",
};

export function normalizeHallRequestStatus(status) {
  if (status === HALL_REQUEST_STATUS.accepted) return HALL_REQUEST_STATUS.accepted;
  if (status === HALL_REQUEST_STATUS.rejected) return HALL_REQUEST_STATUS.rejected;
  return HALL_REQUEST_STATUS.pending;
}
