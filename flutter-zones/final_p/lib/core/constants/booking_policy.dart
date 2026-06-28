/// Shared booking business rules (must stay aligned with Laravel).
abstract final class BookingPolicy {
  /// Customer may cancel until this many minutes before slot start (e.g. 4:00 → lock at 3:45).
  static const int customerCancellationLockMinutes = 15;

  /// No-show grace after start is enforced server-side (CustomerBanService::GRACE_MINUTES = 14).
  static const int serverNoShowGraceMinutes = 14;
}
