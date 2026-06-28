<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Device;
use App\Models\Offer;
use App\Models\Package;
use App\Models\Station;
use App\Models\User;
use App\Services\LoyaltyService;
use App\Services\PlatformCommissionService;
use App\Support\BookingStatus;
use App\Support\MediaUrl;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerBookingService
{
    public function __construct(
        private readonly BookingAvailabilityService $availability,
        private readonly BookingReceiptPdfService $receipts,
        private readonly LoyaltyService $loyalty,
        private readonly PlatformCommissionService $commission,
        private readonly BookingStopService $bookingStops,
        private readonly CustomerBanService $customerBans,
    ) {}

    public function create(
        Station $station,
        Package $package,
        Device $device,
        User $user,
        string $date,
        string $hour,
        string $paymentMethod,
        ?Offer $offer = null,
    ): Booking {
        if ($offer) {
            $this->assertOfferMatchesBooking($offer, $station, $package, $date);
        }

        if ($paymentMethod === 'loyalty_reward') {
            if ($offer) {
                throw ValidationException::withMessages([
                    'payment_method' => ['لا يمكن استخدام مكافأة الولاء مع العروض.'],
                ]);
            }
            if (! $this->loyalty->canRedeemReward($user)) {
                throw ValidationException::withMessages([
                    'payment_method' => ['رصيد نقاط الولاء غير كافٍ لفتح مكافأة مجانية.'],
                ]);
            }
        }

        if (! $station->bookings_enabled) {
            throw ValidationException::withMessages([
                'station_id' => ['الحجز غير متاح لهذه الصالة.'],
            ]);
        }

        $this->customerBans->assertCanBookApp($user);

        if ($this->bookingStops->isDateBlocked($station, $date)) {
            $active = $this->bookingStops->activeForStation($station, \Carbon\Carbon::parse($date));
            throw ValidationException::withMessages([
                'date' => [$active ? $this->bookingStops->blockMessage($active) : 'الحجز غير متاح مؤقتاً'],
            ]);
        }

        $hour = $this->availability->normalizeHour($hour);
        $duration = max(1, (int) ($package->minimum_hours ?? 1));
        $hourTo = $this->availability->calcHourTo($hour, $duration);

        if (! $this->availability->deviceIsAvailable(
            $station->id,
            $device->id,
            $date,
            $hour,
            $duration,
        )) {
            throw ValidationException::withMessages([
                'hour' => ['هذا الموعد لم يعد متاحاً.'],
            ]);
        }

        $hourlyPrice = (float) $package->hourly_price;
        $hoursCount = $this->availability->hourSpan($hour, $hourTo);

        if ($offer) {
            $originalHourly = (float) $offer->original_price;
            $discountedHourly = (float) $offer->discounted_price;
            $discountPercent = (int) ($offer->discount_percent ?? 0);
            $subtotal = round($originalHourly * $hoursCount, 2);
            $total = round($discountedHourly * $hoursCount, 2);
            $discountAmount = round(max(0, $subtotal - $total), 2);
            $bookingType = 'offer';
        } elseif ($paymentMethod === 'loyalty_reward') {
            $originalHourly = $hourlyPrice;
            $discountedHourly = 0;
            $discountPercent = 0;
            $subtotal = round($hourlyPrice * $hoursCount, 2);
            $total = 0;
            $discountAmount = $subtotal;
            $bookingType = 'loyalty';
        } else {
            $originalHourly = $hourlyPrice;
            $discountedHourly = $hourlyPrice;
            $discountPercent = 0;
            $subtotal = round($hourlyPrice * $hoursCount, 2);
            $total = $subtotal;
            $discountAmount = 0;
            $bookingType = 'regular';
        }

        $isOnline = $paymentMethod === 'online';
        $isLoyaltyReward = $paymentMethod === 'loyalty_reward';
        $bookingStatus = $isOnline ? 'pending' : 'confirmed';
        $paymentStatus = $isLoyaltyReward ? 'paid' : ($isOnline ? 'pending' : 'pending');
        $resolvedPaymentMethod = $isOnline ? 'online' : ($isLoyaltyReward ? 'loyalty_reward' : 'cash');

        $commissionRate = 0.0;
        $commissionAmount = 0.0;
        if ($this->commission->appliesToMobileBooking($bookingType, $total)) {
            $commission = $this->commission->calculateForTotal($total);
            $commissionRate = $commission['rate'];
            $commissionAmount = $commission['amount'];
        }

        $booking = DB::transaction(function () use (
            $user,
            $station,
            $device,
            $package,
            $offer,
            $date,
            $hour,
            $hourTo,
            $hoursCount,
            $originalHourly,
            $discountedHourly,
            $discountPercent,
            $discountAmount,
            $subtotal,
            $total,
            $bookingType,
            $bookingStatus,
            $paymentStatus,
            $resolvedPaymentMethod,
            $isLoyaltyReward,
            $commissionRate,
            $commissionAmount,
        ) {
            $booking = Booking::create([
                'user_id' => $user->id,
                'station_id' => $station->id,
                'device_id' => $device->id,
                'package_id' => $package->id,
                'offer_id' => $offer?->id,
                'booking_number' => $this->nextBookingNumber($station->id),
                'booking_type' => $bookingType,
                'visitor_name' => $user->full_name ?? null,
                'visitor_phone' => $user->phone ?? null,
                'visitor_email' => $user->email ?? null,
                'start_date' => $date,
                'end_date' => $date,
                'start_time' => $hour,
                'end_time' => $hourTo,
                'hours_count' => $hoursCount,
                'original_hourly_price' => $originalHourly,
                'discounted_hourly_price' => $discountedHourly,
                'discount_percent' => $discountPercent,
                'discount_amount' => $discountAmount,
                'subtotal_price' => $subtotal,
                'platform_commission_amount' => $commissionAmount,
                'platform_commission_rate' => $commissionRate,
                'total_price' => $total,
                'payment_method' => $resolvedPaymentMethod,
                'payment_status' => $paymentStatus,
                'booking_status' => $bookingStatus,
                'session_status' => 'waiting',
                'is_checked_in' => false,
                'booking_source' => 'mobile_app',
            ]);

            if ($isLoyaltyReward) {
                $this->loyalty->redeemForBooking($user, $booking);
            }

            return $booking;
        });

        if (! $isOnline) {
            $this->finalizePaidOrConfirmed($booking->fresh(['station', 'device', 'package', 'user']));
        }

        return $booking->fresh(['station', 'device', 'package', 'user']);
    }

    /**
     * Manual reception booking — same availability + receipt pipeline as customer cash bookings.
     * Payment is always pay-on-arrival (cash, pending until check-in).
     */
    public function createFromReception(
        Station $station,
        Package $package,
        Device $device,
        string $date,
        string $hour,
        ?string $visitorName = null,
        ?string $visitorPhone = null,
        ?string $visitorEmail = null,
        ?string $notes = null,
        ?string $bookingNumber = null,
    ): Booking {
        if (! $station->bookings_enabled) {
            throw ValidationException::withMessages([
                'station_id' => ['الحجز غير متاح لهذه الصالة.'],
            ]);
        }

        if ($this->bookingStops->isDateBlocked($station, $date)) {
            $active = $this->bookingStops->activeForStation($station, \Carbon\Carbon::parse($date));
            throw ValidationException::withMessages([
                'date' => [$active ? $this->bookingStops->blockMessage($active) : 'الحجز غير متاح مؤقتاً'],
            ]);
        }

        if ($device->operational_status !== 'active') {
            throw ValidationException::withMessages([
                'device_id' => ['الجهاز تحت الصيانة أو غير متاح للحجز.'],
            ]);
        }

        $hour = $this->availability->normalizeHour($hour);
        $duration = max(1, (int) ($package->minimum_hours ?? 1));
        $hourTo = $this->availability->calcHourTo($hour, $duration);

        if (! $this->availability->deviceIsAvailable(
            $station->id,
            $device->id,
            $date,
            $hour,
            $duration,
        )) {
            throw ValidationException::withMessages([
                'hour' => ['هذا الموعد لم يعد متاحاً.'],
            ]);
        }

        $hourlyPrice = (float) $package->hourly_price;
        $hoursCount = $this->availability->hourSpan($hour, $hourTo);
        $subtotal = round($hourlyPrice * $hoursCount, 2);

        $booking = DB::transaction(function () use (
            $station,
            $device,
            $package,
            $date,
            $hour,
            $hourTo,
            $hoursCount,
            $hourlyPrice,
            $subtotal,
            $visitorName,
            $visitorPhone,
            $visitorEmail,
            $notes,
            $bookingNumber,
        ) {
            return Booking::create([
                'user_id' => null,
                'station_id' => $station->id,
                'device_id' => $device->id,
                'package_id' => $package->id,
                'booking_number' => $bookingNumber ?? $this->nextReceptionBookingNumber($station->id),
                'booking_type' => 'regular',
                'visitor_name' => trim((string) $visitorName) ?: null,
                'visitor_phone' => trim((string) $visitorPhone) ?: null,
                'visitor_email' => trim((string) $visitorEmail) ?: null,
                'start_date' => $date,
                'end_date' => $date,
                'start_time' => $hour,
                'end_time' => $hourTo,
                'hours_count' => $hoursCount,
                'original_hourly_price' => $hourlyPrice,
                'discounted_hourly_price' => $hourlyPrice,
                'discount_amount' => 0,
                'subtotal_price' => $subtotal,
                'platform_commission_amount' => 0,
                'platform_commission_rate' => 0,
                'total_price' => $subtotal,
                'payment_method' => 'cash',
                'payment_status' => 'pending',
                'booking_status' => 'confirmed',
                'session_status' => 'waiting',
                'is_checked_in' => false,
                'checked_in_at' => null,
                'booking_source' => 'dashboard',
                'notes' => trim((string) $notes) ?: null,
            ]);
        });

        $this->finalizePaidOrConfirmed($booking->fresh(['station', 'device', 'package']));

        return $booking->fresh(['station', 'device', 'package']);
    }

    public function finalizePaidOrConfirmed(Booking $booking): Booking
    {
        if (BookingStatus::isCancelled($booking->booking_status)) {
            return $booking;
        }

        $booking->update([
            'booking_status' => 'confirmed',
            'payment_status' => in_array($booking->payment_method, ['online', 'loyalty_reward'], true)
                ? 'paid'
                : $booking->payment_status,
        ]);

        $booking = $booking->fresh(['station', 'device', 'package', 'user']);

        if (! $booking->receipt_pdf_path) {
            $this->receipts->saveForBooking($booking);
            $booking = $booking->fresh();
        }

        return $booking;
    }

    /**
     * @return array<string, mixed>
     */
    public function toCustomerArray(Booking $booking): array
    {
        $booking->loadMissing(['station', 'device', 'package']);

        return [
            'id' => $booking->id,
            'booking_number' => $booking->booking_number,
            'station_id' => $booking->station_id,
            'station_name' => $booking->station?->name,
            'package_id' => $booking->package_id,
            'package_name' => $booking->package?->name,
            'device_id' => $booking->device_id,
            'device_code' => $booking->device?->device_code,
            'device_name' => $booking->device?->display_name ?: $booking->device?->device_code,
            'date' => $booking->start_date?->format('Y-m-d'),
            'hour' => $this->availability->normalizeHour((string) $booking->start_time),
            'hour_to' => $this->availability->normalizeHour((string) $booking->end_time),
            'hours_count' => $booking->hours_count,
            'total_price' => (float) $booking->total_price,
            'original_total_price' => (float) $booking->subtotal_price,
            'platform_commission_rate' => (float) $booking->platform_commission_rate,
            'platform_commission_amount' => (float) $booking->platform_commission_amount,
            'hall_net_amount' => $this->commission->hallNetRevenue($booking),
            'discount_percent' => (int) ($booking->discount_percent ?? 0),
            'booking_type' => $booking->booking_type ?? 'regular',
            'offer_id' => $booking->offer_id,
            'payment_method' => $booking->payment_method,
            'payment_status' => $booking->payment_status,
            'booking_status' => $booking->booking_status,
            'booking_status_label' => $booking->booking_status === BookingStatus::CANCELLED_MAINTENANCE
                ? 'ملغى بسبب الصيانة'
                : null,
            'needs_refund_review' => (bool) $booking->needs_refund_review,
            'cancelled_at' => $booking->cancelled_at?->toIso8601String(),
            'session_status' => $booking->session_status,
            'session_started_at' => $booking->session_started_at?->toIso8601String(),
            'session_ended_at' => $booking->session_ended_at?->toIso8601String(),
            'session_duration_seconds' => $booking->session_duration_seconds,
            'is_checked_in' => $booking->is_checked_in,
            'ends_at' => $booking->start_date?->format('Y-m-d').' '.$this->availability->normalizeHour((string) $booking->end_time).':00',
            'receipt_pdf_url' => MediaUrl::resolve($booking->receipt_pdf_path),
            'created_at' => $booking->created_at?->toIso8601String(),
        ];
    }

    private function nextBookingNumber(int $stationId): string
    {
        return $this->nextPrefixedBookingNumber($stationId, 'APP');
    }

    private function nextReceptionBookingNumber(int $stationId): string
    {
        return $this->nextPrefixedBookingNumber($stationId, 'BK');
    }

    private function nextPrefixedBookingNumber(int $stationId, string $prefix): string
    {
        $latest = Booking::query()
            ->where('station_id', $stationId)
            ->where('booking_number', 'like', "{$prefix}-%")
            ->orderByDesc('id')
            ->value('booking_number');

        $max = 0;
        if ($latest && preg_match('/-(\d+)$/', $latest, $m)) {
            $max = (int) $m[1];
        }

        return sprintf('%s-%03d', $prefix, $max + 1);
    }

    public function resolveOfferForBooking(
        int $offerId,
        Station $station,
        Package $package,
        string $date,
    ): Offer {
        $offer = Offer::query()
            ->whereKey($offerId)
            ->where('is_active', true)
            ->where('station_id', $station->id)
            ->where('package_id', $package->id)
            ->first();

        if (! $offer) {
            throw ValidationException::withMessages([
                'offer_id' => ['العرض غير متاح.'],
            ]);
        }

        if ($offer->valid_from && now()->lt($offer->valid_from)) {
            throw ValidationException::withMessages([
                'offer_id' => ['العرض لم يبدأ بعد.'],
            ]);
        }

        if ($offer->expires_at && now()->gt($offer->expires_at)) {
            throw ValidationException::withMessages([
                'offer_id' => ['انتهت صلاحية العرض.'],
            ]);
        }

        if (! $this->availability->isDateInOfferWindow($offer, $date)) {
            throw ValidationException::withMessages([
                'date' => ['التاريخ خارج فترة العرض.'],
            ]);
        }

        return $offer;
    }

    private function assertOfferMatchesBooking(
        Offer $offer,
        Station $station,
        Package $package,
        string $date,
    ): void {
        if ((int) $offer->station_id !== (int) $station->id
            || (int) $offer->package_id !== (int) $package->id) {
            throw ValidationException::withMessages([
                'offer_id' => ['العرض لا يطابق الصالة أو الباقة.'],
            ]);
        }

        if (! $this->availability->isDateInOfferWindow($offer, $date)) {
            throw ValidationException::withMessages([
                'date' => ['التاريخ خارج فترة العرض.'],
            ]);
        }
    }
}
