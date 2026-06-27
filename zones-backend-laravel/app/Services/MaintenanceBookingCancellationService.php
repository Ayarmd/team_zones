<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\CustomerNotification;
use App\Models\Device;
use App\Models\DeviceToken;
use App\Support\BookingStatus;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MaintenanceBookingCancellationService
{
    public function __construct(
        private readonly FcmPushService $fcm,
        private readonly BookingAvailabilityService $availability,
    ) {}

    /**
     * @return list<Booking>
     */
    public function cancelFutureBookingsForDevice(Device $device): array
    {
        $bookings = $this->findFutureBookingsForDevice($device);

        if ($bookings === []) {
            return [];
        }

        $cancelled = [];

        foreach ($bookings as $booking) {
            $cancelled[] = $this->cancelBookingForMaintenance($booking);
        }

        return $cancelled;
    }

    /**
     * Future = session not started yet (not playing/finished/no_show) and start > now.
     *
     * @return list<Booking>
     */
    private function findFutureBookingsForDevice(Device $device): array
    {
        $now = Carbon::now(config('app.timezone', 'Africa/Tripoli'));

        return Booking::query()
            ->with(['station', 'device', 'package', 'user'])
            ->where('device_id', $device->id)
            ->whereIn('booking_status', [BookingStatus::PENDING, BookingStatus::CONFIRMED])
            ->whereNotIn('session_status', ['playing', 'finished', 'no_show'])
            ->orderBy('start_date')
            ->orderBy('start_time')
            ->get()
            ->filter(fn (Booking $booking) => $this->bookingStartsAfter($booking, $now))
            ->values()
            ->all();
    }

    private function bookingStartsAfter(Booking $booking, Carbon $now): bool
    {
        $date = $booking->start_date?->format('Y-m-d');
        if (! $date) {
            return false;
        }

        $hour = $this->availability->normalizeHour((string) $booking->start_time);
        $start = Carbon::parse("{$date} {$hour}", config('app.timezone', 'Africa/Tripoli'));

        return $start->greaterThan($now);
    }

    private function cancelBookingForMaintenance(Booking $booking): Booking
    {
        return DB::transaction(function () use ($booking) {
            $needsRefundReview = $booking->payment_status === 'paid'
                && $booking->payment_method === 'online';

            $booking->update([
                'booking_status' => BookingStatus::CANCELLED_MAINTENANCE,
                'session_status' => 'finished',
                'needs_refund_review' => $needsRefundReview,
                'cancelled_at' => now(),
                'notes' => trim(($booking->notes ? $booking->notes.' ' : '').'[إلغاء تلقائي: دخول الجهاز في الصيانة]'),
            ]);

            $booking = $booking->fresh(['station', 'device', 'package', 'user']);

            $this->notifyCustomer($booking);

            return $booking;
        });
    }

    private function notifyCustomer(Booking $booking): void
    {
        if (! $booking->user_id) {
            return;
        }

        $stationName = $booking->station?->name ?? 'الصالة';
        $deviceName = $booking->device?->display_name
            ?: $booking->device?->device_code
            ?: 'الجهاز';
        $dateIso = $booking->start_date?->format('Y-m-d') ?? '';
        $dateDisplay = $booking->start_date?->format('d/m/Y') ?? '';
        $time = $this->availability->normalizeHour((string) $booking->start_time);

        $title = 'تم إلغاء حجزك';
        $body = "تم إلغاء حجزك في {$dateDisplay} على الجهاز {$deviceName} لأن الجهاز دخل في الصيانة.\n"
            ."الصالة: {$stationName}\n"
            ."التاريخ: {$dateDisplay}\n"
            ."الوقت: {$time}";

        $payload = [
            'booking_id' => $booking->id,
            'booking_number' => $booking->booking_number,
            'station_id' => $booking->station_id,
            'station_name' => $stationName,
            'device_id' => $booking->device_id,
            'device_name' => $deviceName,
            'date' => $dateIso,
            'date_display' => $dateDisplay,
            'time' => $time,
            'needs_refund_review' => (bool) $booking->needs_refund_review,
            'email_ready' => true,
        ];

        CustomerNotification::create([
            'user_id' => $booking->user_id,
            'type' => 'booking_cancelled_maintenance',
            'title' => $title,
            'body' => $body,
            'payload' => $payload,
        ]);

        $tokens = DeviceToken::query()
            ->where('user_id', $booking->user_id)
            ->pluck('token')
            ->filter()
            ->values()
            ->all();

        if ($tokens !== []) {
            $this->fcm->sendToTokens($tokens, $title, $body, [
                'type' => 'booking_cancelled_maintenance',
                'booking_id' => (string) $booking->id,
                'booking_number' => (string) $booking->booking_number,
                'date' => $dateDisplay,
                'device_name' => $deviceName,
            ]);
        }
    }
}
