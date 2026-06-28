<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Device;
use App\Models\Offer;
use App\Models\Package;
use App\Models\Station;
use App\Models\User;
use App\Services\BookingAvailabilityService;
use App\Services\CustomerBanService;
use App\Services\CustomerBookingService;
use App\Support\BookingStatus;
use App\Support\CustomerCancellationPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CustomerBookingController extends Controller
{
    public function __construct(
        private readonly BookingAvailabilityService $availability,
        private readonly CustomerBookingService $bookings,
        private readonly CustomerBanService $customerBans,
    ) {}

    public function availability(Request $request, Station $station): JsonResponse
    {
        $validated = $request->validate([
            'package_id' => 'required|integer',
            'date' => 'required|date_format:Y-m-d',
            'offer_id' => 'nullable|integer|exists:offers,id',
        ]);

        $package = Package::query()
            ->where('station_id', $station->id)
            ->whereKey($validated['package_id'])
            ->where('is_active', true)
            ->first();

        if (! $package) {
            throw ValidationException::withMessages([
                'package_id' => ['الباقة غير موجودة.'],
            ]);
        }

        $offer = null;
        if (! empty($validated['offer_id'])) {
            $offer = $this->bookings->resolveOfferForBooking(
                (int) $validated['offer_id'],
                $station,
                $package,
                $validated['date'],
            );
        }

        $result = $this->availability->slotsForPackage(
            $station,
            $package,
            $validated['date'],
            $offer,
        );

        return response()->json([
            'station_id' => $station->id,
            'package_id' => $package->id,
            'offer_id' => $offer?->id,
            'date' => $validated['date'],
            'is_available' => $result['available'],
            'message' => $result['message'],
            'slots' => $result['slots'],
            'booking_stop' => $result['booking_stop'] ?? null,
            'ban_status' => $this->customerBans->customerStatusPayload($this->customer($request)),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $this->customer($request);

        $bookings = Booking::query()
            ->where('user_id', $user->id)
            ->where('booking_source', 'mobile_app')
            ->with(['station', 'device', 'package'])
            ->orderByDesc('start_date')
            ->orderByDesc('start_time')
            ->get()
            ->map(fn (Booking $b) => $this->bookings->toCustomerArray($b));

        return response()->json(['bookings' => $bookings]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->customer($request);

        $validated = $request->validate([
            'station_id' => 'required|integer|exists:stations,id',
            'package_id' => 'required|integer',
            'device_id' => 'required|integer',
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'hour' => 'required|date_format:H:i',
            'payment_method' => 'required|in:online,cash,loyalty_reward',
            'offer_id' => 'nullable|integer|exists:offers,id',
        ]);

        $station = Station::query()
            ->whereKey($validated['station_id'])
            ->where('is_active', true)
            ->where('is_published', true)
            ->firstOrFail();

        $package = Package::query()
            ->where('station_id', $station->id)
            ->whereKey($validated['package_id'])
            ->where('is_active', true)
            ->first();

        if (! $package) {
            throw ValidationException::withMessages([
                'package_id' => ['الباقة غير موجودة.'],
            ]);
        }

        $device = Device::query()
            ->where('station_id', $station->id)
            ->where('package_id', $package->id)
            ->whereKey($validated['device_id'])
            ->where('operational_status', 'active')
            ->first();

        if (! $device) {
            throw ValidationException::withMessages([
                'device_id' => ['الجهاز غير متاح.'],
            ]);
        }

        $offer = null;
        if (! empty($validated['offer_id'])) {
            if ($validated['payment_method'] === 'loyalty_reward') {
                throw ValidationException::withMessages([
                    'payment_method' => ['لا يمكن استخدام مكافأة الولاء مع العروض.'],
                ]);
            }

            $offer = $this->bookings->resolveOfferForBooking(
                (int) $validated['offer_id'],
                $station,
                $package,
                $validated['date'],
            );
        }

        $booking = $this->bookings->create(
            $station,
            $package,
            $device,
            $user,
            $validated['date'],
            $validated['hour'],
            $validated['payment_method'],
            $offer,
        );

        return response()->json([
            'message' => match ($validated['payment_method']) {
                'online' => 'تم إنشاء الحجز — أكمل الدفع',
                'loyalty_reward' => 'تم الحجز بمكافأة الولاء بنجاح',
                default => 'تم الحجز بنجاح',
            },
            'booking' => $this->bookings->toCustomerArray($booking),
            'loyalty' => app(\App\Services\LoyaltyService::class)->progressPayload($user->fresh()),
        ], 201);
    }

    public function show(Request $request, Booking $booking): JsonResponse
    {
        $user = $this->customer($request);
        $this->authorizeCustomerBooking($user, $booking);

        return response()->json([
            'booking' => $this->bookings->toCustomerArray(
                $booking->load(['station', 'device', 'package']),
            ),
        ]);
    }

    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $user = $this->customer($request);
        $this->authorizeCustomerBooking($user, $booking);

        if (in_array($booking->booking_status, BookingStatus::inactiveStatuses(), true)) {
            return response()->json(['message' => 'لا يمكن إلغاء هذا الحجز.'], 422);
        }

        CustomerCancellationPolicy::assertCanCancel($booking);

        $booking->update([
            'booking_status' => BookingStatus::CANCELLED,
            'session_status' => 'finished',
            'cancelled_at' => now(),
        ]);

        return response()->json(['message' => 'تم إلغاء الحجز']);
    }

    /**
     * After Plutu WebView success — finalize booking if payment callback landed.
     */
    public function syncPayment(Request $request, Booking $booking): JsonResponse
    {
        $user = $this->customer($request);
        $this->authorizeCustomerBooking($user, $booking);

        $validated = $request->validate([
            'invoice_no' => 'nullable|string|max:120',
            'approved' => 'nullable',
            'canceled' => 'nullable',
            'amount' => 'nullable',
            'transaction_id' => 'nullable',
            'gateway' => 'nullable|string|max:50',
            'hashed' => 'nullable|string|max:255',
        ]);

        if (! empty($validated['invoice_no']) && ($validated['approved'] ?? null) == 1) {
            try {
                app(\App\Services\PlutuLocalBankPaymentService::class)
                    ->applyCallbackForBooking($booking, $validated);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        app(\App\Services\PlutuLocalBankPaymentService::class)
            ->reconcileBookingPayment($booking);

        $booking = $booking->fresh(['station', 'device', 'package']);

        if ($booking->payment_method === 'online' && $booking->payment_status !== 'paid') {
            $paidTransaction = \App\Models\PaymentTransaction::query()
                ->where('booking_id', $booking->id)
                ->where('status', 'paid')
                ->exists();

            if ($paidTransaction) {
                $booking = $this->bookings->finalizePaidOrConfirmed($booking);
            }
        }

        if ($booking->payment_status === 'paid' && $booking->booking_status === 'pending') {
            $booking = $this->bookings->finalizePaidOrConfirmed($booking);
        }

        return response()->json([
            'booking' => $this->bookings->toCustomerArray(
                $booking->fresh(['station', 'device', 'package']),
            ),
        ]);
    }

    private function customer(Request $request): User
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }

    private function authorizeCustomerBooking(User $user, Booking $booking): void
    {
        if ((int) $booking->user_id !== (int) $user->id) {
            abort(403);
        }
    }
}
