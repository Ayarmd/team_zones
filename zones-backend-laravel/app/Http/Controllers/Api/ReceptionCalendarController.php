<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Device;
use App\Models\Package;
use App\Models\Station;
use App\Models\User;
use App\Services\CustomerBanService;
use App\Services\CustomerBookingService;
use App\Services\LoyaltyService;
use App\Services\PaymentLogService;
use App\Support\BookingStatus;
use App\Support\MediaUrl;
use App\Support\SessionStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReceptionCalendarController extends Controller
{
    public function __construct(
        private readonly LoyaltyService $loyalty,
        private readonly CustomerBookingService $bookings,
        private readonly CustomerBanService $customerBans,
    ) {}
    public function index(Request $request): JsonResponse
    {
        $user = $this->staffUser($request);
        $stationId = $user->resolvedStationId();

        $validated = $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $date = $validated['date'];

        $bookings = Booking::query()
            ->where('station_id', $stationId)
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->whereNotIn('booking_status', BookingStatus::inactiveStatuses())
            ->with('package')
            ->orderBy('start_time')
            ->get();

        $slots = [];
        foreach ($bookings as $booking) {
            foreach ($this->expandBookingHours($booking, $date) as $hour) {
                $slots[] = $this->mapBookingToSlot($booking, $date, $hour);
            }
        }

        return response()->json([
            'date' => $date,
            'slots' => $slots,
        ]);
    }

    public function active(Request $request): JsonResponse
    {
        $user = $this->staffUser($request);
        $stationId = $user->resolvedStationId();

        $bookings = Booking::query()
            ->where('station_id', $stationId)
            ->whereNotIn('booking_status', BookingStatus::inactiveStatuses())
            ->with('package')
            ->orderBy('start_date')
            ->orderBy('start_time')
            ->get();

        $slots = [];
        foreach ($bookings as $booking) {
            $date = $booking->start_date->format('Y-m-d');
            foreach ($this->expandBookingHours($booking, $date) as $hour) {
                $slots[] = $this->mapBookingToSlot($booking, $date, $hour);
            }
        }

        return response()->json(['slots' => $slots]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->staffUser($request);
        $stationId = $user->resolvedStationId();

        $validated = $request->validate([
            'device_id' => 'required|integer',
            'date' => 'required|date_format:Y-m-d',
            'hour' => 'required|date_format:H:i',
            'hour_to' => 'nullable|date_format:H:i',
            'visitor_name' => 'required|string|max:255',
            'visitor_phone' => 'required|string|max:50',
            'visitor_email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:2000',
            'package_id' => 'nullable|integer',
            'booking_code' => 'nullable|string|max:50',
        ]);

        $station = Station::query()->whereKey($stationId)->firstOrFail();

        $device = Device::query()
            ->where('station_id', $stationId)
            ->whereKey($validated['device_id'])
            ->first();

        if (! $device) {
            throw ValidationException::withMessages([
                'device_id' => ['الجهاز غير موجود في هذه الصالة.'],
            ]);
        }

        $packageId = $validated['package_id'] ?? $device->package_id;
        if (! $packageId) {
            throw ValidationException::withMessages([
                'package_id' => ['الباقة مطلوبة لهذا الحجز.'],
            ]);
        }

        $package = Package::query()
            ->where('station_id', $stationId)
            ->whereKey($packageId)
            ->first();

        if (! $package) {
            throw ValidationException::withMessages([
                'package_id' => ['الباقة غير موجودة في هذه الصالة.'],
            ]);
        }

        $hour = $this->normalizeHour($validated['hour']);

        $booking = $this->bookings->createFromReception(
            $station,
            $package,
            $device,
            $validated['date'],
            $hour,
            $validated['visitor_name'],
            $validated['visitor_phone'],
            $validated['visitor_email'] ?? null,
            $validated['notes'] ?? null,
            $validated['booking_code'] ?? null,
        );

        $booking->load('package');

        return response()->json([
            'message' => 'تم الحجز',
            'slot' => $this->mapBookingToSlot($booking, $validated['date'], $hour),
        ], 201);
    }

    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $user = $this->staffUser($request);
        $this->authorizeBooking($user, $booking);

        if (in_array($booking->booking_status, BookingStatus::inactiveStatuses(), true)) {
            return response()->json(['message' => 'الحجز غير قابل للإلغاء.'], 422);
        }

        $booking->update([
            'booking_status' => BookingStatus::CANCELLED,
            'session_status' => 'finished',
            'cancelled_at' => now(),
        ]);

        return response()->json(['message' => 'تم إلغاء الحجز']);
    }

    public function checkIn(Request $request, Booking $booking): JsonResponse
    {
        $user = $this->staffUser($request);
        $this->authorizeBooking($user, $booking);

        if (in_array($booking->booking_status, BookingStatus::inactiveStatuses(), true)) {
            return response()->json(['message' => 'لا يمكن تسجيل حضور لهذا الحجز.'], 422);
        }

        if ($booking->is_checked_in) {
            return response()->json(['message' => 'تم تسجيل الحضور مسبقاً.'], 422);
        }

        $updates = [
            'is_checked_in' => true,
            'checked_in_at' => now(),
            'session_status' => 'checked_in',
        ];

        if (
            $booking->payment_method === 'cash'
            && $booking->payment_status === 'pending'
            && ! in_array($booking->booking_type, ['loyalty'], true)
        ) {
            $updates['payment_status'] = 'paid';
        }

        $booking->update($updates);
        $booking->refresh();

        app(PaymentLogService::class)->logPayOnArrivalPayment($booking);

        $booking->load('package');

        return response()->json([
            'message' => 'تم تسجيل الحضور',
            'slot' => $this->mapBookingToSlot(
                $booking,
                $booking->start_date->format('Y-m-d'),
                $this->normalizeHour($booking->start_time),
            ),
        ]);
    }

    public function startSession(Request $request, Booking $booking): JsonResponse
    {
        $user = $this->staffUser($request);
        $this->authorizeBooking($user, $booking);

        if (in_array($booking->booking_status, BookingStatus::inactiveStatuses(), true)) {
            return response()->json(['message' => 'لا يمكن بدء جلسة لهذا الحجز.'], 422);
        }

        if (! $booking->is_checked_in) {
            return response()->json(['message' => 'يجب تسجيل الحضور قبل بدء الجلسة.'], 422);
        }

        if ($booking->session_status === 'playing') {
            return response()->json(['message' => 'الجلسة قيد التشغيل بالفعل.'], 422);
        }

        $startedAt = now();

        $booking->update([
            'session_status' => 'playing',
            'session_started_at' => $startedAt,
            'session_ended_at' => null,
            'session_duration_seconds' => null,
        ]);

        $booking = $booking->fresh('package');

        return response()->json([
            'message' => 'بدأت الجلسة',
            'slot' => $this->mapBookingToSlot(
                $booking,
                $booking->start_date->format('Y-m-d'),
                $this->normalizeHour($booking->start_time),
            ),
        ]);
    }

    public function markNoShow(Request $request, Booking $booking): JsonResponse
    {
        $user = $this->staffUser($request);
        $this->authorizeBooking($user, $booking);

        if ($booking->session_status === SessionStatus::NO_SHOW) {
            return response()->json(['message' => 'تم تسجيل عدم الحضور مسبقاً.'], 422);
        }

        if ($booking->is_checked_in) {
            return response()->json(['message' => 'لا يمكن تسجيل عدم حضور لحجز تم تسجيل حضوره.'], 422);
        }

        if (in_array($booking->booking_status, BookingStatus::inactiveStatuses(), true)) {
            return response()->json(['message' => 'الحجز غير قابل لمعالجة عدم الحضور.'], 422);
        }

        $result = $this->customerBans->markBookingNoShow($booking);
        if ($result === null) {
            return response()->json(['message' => 'تعذّر معالجة عدم الحضور لهذا الحجز.'], 422);
        }

        $booking = $booking->fresh('package');

        return response()->json([
            'message' => 'تم تسجيل عدم الحضور وإلغاء الحجز.',
            'no_show_count' => $result['no_show_count'],
            'ban_created' => $result['ban_created'],
            'ban' => $result['ban']
                ? $this->customerBans->banPayload($result['ban'], true)
                : null,
            'slot' => $this->mapBookingToSlot(
                $booking,
                $booking->start_date->format('Y-m-d'),
                $this->normalizeHour($booking->start_time),
            ),
        ]);
    }

    public function endSession(Request $request, Booking $booking): JsonResponse
    {
        $user = $this->staffUser($request);
        $this->authorizeBooking($user, $booking);

        if ($booking->booking_status === 'completed') {
            return response()->json(['message' => 'تم إنهاء الجلسة مسبقاً.'], 422);
        }

        $endedAt = now();
        $startedAt = $booking->session_started_at ?? $booking->checked_in_at;
        $durationSeconds = $startedAt
            ? max(0, $endedAt->diffInSeconds($startedAt))
            : 0;

        $booking->update([
            'booking_status' => 'completed',
            'session_status' => 'finished',
            'session_ended_at' => $endedAt,
            'session_duration_seconds' => $durationSeconds,
        ]);

        $loyaltyResult = $this->loyalty->awardForCompletedSession($booking->fresh());

        return response()->json([
            'message' => 'تم إنهاء الجلسة',
            'duration_seconds' => $durationSeconds,
            'loyalty' => $loyaltyResult,
        ]);
    }

    private function staffUser(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->hasAnyRole(['manager', 'reception'])) {
            abort(403, 'غير مصرح');
        }

        if (! $user->resolvedStationId()) {
            abort(404, 'لا توجد صالة مرتبطة بهذا الحساب');
        }

        return $user;
    }

    private function authorizeBooking(User $user, Booking $booking): void
    {
        if ((int) $booking->station_id !== (int) $user->resolvedStationId()) {
            abort(403, 'غير مصرح');
        }
    }

    private function mapBookingToSlot(Booking $booking, string $date, string $hour): array
    {
        $status = match ($booking->session_status) {
            'playing' => 'busy',
            SessionStatus::NO_SHOW => 'no_show',
            default => 'reserved',
        };
        $source = $booking->booking_source === 'mobile_app' ? 'app' : 'manual';
        $package = $booking->package;

        return [
            'id' => $booking->id,
            'deviceId' => (string) $booking->device_id,
            'date' => $date,
            'hour' => $hour,
            'hourTo' => $this->normalizeHour($booking->end_time),
            'status' => $status,
            'bookingCode' => $booking->booking_number,
            'visitorNumber' => $booking->booking_number,
            'visitorName' => $booking->visitor_name ?? '',
            'phone' => $booking->visitor_phone ?? '',
            'email' => $booking->visitor_email ?? '',
            'notes' => $booking->notes ?? '',
            'packageId' => $booking->package_id,
            'packageName' => $package?->name ?? '—',
            'packagePrice' => (string) ($booking->original_hourly_price ?? ''),
            'totalPrice' => (string) ($booking->total_price ?? ''),
            'paymentType' => $this->mapPaymentType($booking),
            'paymentMethod' => $booking->payment_method,
            'isPaid' => $booking->payment_status === 'paid',
            'source' => $source,
            'bookingType' => $source === 'app' ? 'تطبيق الزبون' : 'حجز يدوي',
            'attendanceStatus' => match (true) {
                $booking->session_status === SessionStatus::NO_SHOW => 'no_show',
                $booking->is_checked_in => 'checked_in',
                default => 'awaiting',
            },
            'sessionStatus' => $booking->session_status,
            'startedAt' => $booking->session_started_at?->toIso8601String(),
            'endedAt' => $booking->session_ended_at?->toIso8601String(),
            'sessionDurationSeconds' => $booking->session_duration_seconds,
            'receiptPdfUrl' => MediaUrl::resolve($booking->receipt_pdf_path),
            'createdAt' => $booking->created_at?->toIso8601String(),
        ];
    }

    private function mapPaymentType(Booking $booking): string
    {
        if ($booking->payment_method === 'loyalty_reward' || $booking->booking_type === 'loyalty') {
            return 'loyalty_reward';
        }

        if ($booking->payment_method === 'online') {
            return $booking->payment_status === 'paid' ? 'paid' : 'online_pending';
        }

        return $booking->payment_status === 'paid' ? 'paid' : 'cash';
    }

    private function expandBookingHours(Booking $booking, string $date): array
    {
        $startDate = $booking->start_date->format('Y-m-d');
        $endDate = $booking->end_date->format('Y-m-d');

        if ($date < $startDate || $date > $endDate) {
            return [];
        }

        $start = $this->normalizeHour($booking->start_time);
        $end = $this->normalizeHour($booking->end_time);
        $startH = (int) explode(':', $start)[0];
        $endH = (int) explode(':', $end)[0];

        if ($endH <= $startH) {
            $endH = $startH + max(1, (int) $booking->hours_count);
        }

        $hours = [];
        for ($h = $startH; $h < $endH; $h++) {
            $hours[] = sprintf('%02d:00', $h % 24);
        }

        return $hours;
    }

    private function normalizeHour(string $time): string
    {
        $parts = explode(':', $time);
        $h = (int) ($parts[0] ?? 0);

        return sprintf('%02d:00', $h % 24);
    }
}
