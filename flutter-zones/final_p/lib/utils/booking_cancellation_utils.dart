import '../core/constants/booking_policy.dart';
import '../models/booking.dart';

/// Returns true when the customer may still self-cancel (≥ [BookingPolicy.customerCancellationLockMinutes] before start).
bool canCancelBooking(Booking booking) {
  if (!booking.isActive || booking.isCancelled) return false;

  final start = booking.startDateTime;
  if (start == null) return true;

  return start.difference(DateTime.now()) >=
      const Duration(minutes: BookingPolicy.customerCancellationLockMinutes);
}

String cancellationBlockedMessage() =>
    'لا يمكن الإلغاء خلال ${BookingPolicy.customerCancellationLockMinutes} دقيقة من موعد الحجز — ولا يُسترد المبلغ المدفوع';
