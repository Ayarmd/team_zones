<?php

namespace App\Support;

use App\Models\Booking;
use App\Services\BookingAvailabilityService;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Customer self-cancellation: allowed until 15 minutes before slot start.
 * (Distinct from no-show grace — see CustomerBanService::GRACE_MINUTES.)
 */
final class CustomerCancellationPolicy
{
    public const LOCK_MINUTES_BEFORE_START = 15;

    public static function blockedMessage(): string
    {
        return 'لا يمكن الإلغاء خلال '.self::LOCK_MINUTES_BEFORE_START.' دقيقة من موعد الحجز — ولا يُسترد المبلغ المدفوع';
    }

    public static function canCancel(Booking $booking): bool
    {
        if (in_array($booking->booking_status, BookingStatus::inactiveStatuses(), true)) {
            return false;
        }

        $start = self::bookingStartAt($booking);
        if ($start === null) {
            return true;
        }

        return ! now()->greaterThan($start->copy()->subMinutes(self::LOCK_MINUTES_BEFORE_START));
    }

    public static function assertCanCancel(Booking $booking): void
    {
        if (in_array($booking->booking_status, BookingStatus::inactiveStatuses(), true)) {
            throw ValidationException::withMessages([
                'booking' => ['لا يمكن إلغاء هذا الحجز.'],
            ]);
        }

        if (! self::canCancel($booking)) {
            throw ValidationException::withMessages([
                'booking' => [self::blockedMessage()],
            ]);
        }
    }

    public static function bookingStartAt(Booking $booking): ?Carbon
    {
        $date = $booking->start_date?->format('Y-m-d');
        if ($date === null) {
            return null;
        }

        $availability = app(BookingAvailabilityService::class);
        $hour = $availability->normalizeHour((string) $booking->start_time);

        return Carbon::parse("{$date} {$hour}", config('app.timezone', 'Africa/Tripoli'));
    }
}
