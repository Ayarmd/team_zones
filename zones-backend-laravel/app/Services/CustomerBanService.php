<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\CustomerBan;
use App\Models\CustomerNoShowCounter;
use App\Models\CustomerNotification;
use App\Models\User;
use App\Support\BookingStatus;
use App\Support\PhoneNormalizer;
use App\Support\SessionStatus;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerBanService
{
    /** Minutes after slot start before marking no-show (distinct from customer cancel lock). */
    public const GRACE_MINUTES = 14;

    public const BAN_THRESHOLD = 3;

    public const BAN_DAYS = 3;

    public function assertCanBookApp(User $user): void
    {
        $ban = $this->getActiveBanForUser($user);
        if ($ban === null) {
            return;
        }

        throw ValidationException::withMessages([
            'booking' => [$this->blockMessage($ban)],
        ]);
    }

    public function getActiveBanForUser(User $user): ?CustomerBan
    {
        $phoneKey = PhoneNormalizer::normalize($user->phone);
        if ($phoneKey === null) {
            return null;
        }

        return $this->getActiveBanForPhoneKey($phoneKey);
    }

    public function getActiveBanForPhoneKey(string $phoneKey): ?CustomerBan
    {
        $this->expireStaleBans();

        return CustomerBan::query()
            ->where('phone_normalized', $phoneKey)
            ->where('active', true)
            ->whereNull('lifted_at')
            ->where('banned_until', '>', now())
            ->orderByDesc('banned_at')
            ->first();
    }

    public function isBanned(User $user): bool
    {
        return $this->getActiveBanForUser($user) !== null;
    }

    public function getNoShowCount(?string $phone): int
    {
        $phoneKey = PhoneNormalizer::normalize($phone);
        if ($phoneKey === null) {
            return 0;
        }

        $counter = CustomerNoShowCounter::query()
            ->where('phone_normalized', $phoneKey)
            ->first();

        return $counter?->no_show_count ?? 0;
    }

    /**
     * @return array{processed: int, banned: int}
     */
    public function processEligibleNoShows(): array
    {
        $this->expireStaleBans();

        $deadline = now()->subMinutes(self::GRACE_MINUTES);
        $deadlineDate = $deadline->format('Y-m-d');
        $deadlineTime = $deadline->format('H:i:s');
        $processed = 0;
        $banned = 0;

        Booking::query()
            ->whereIn('booking_status', [BookingStatus::PENDING, BookingStatus::CONFIRMED])
            ->where('session_status', SessionStatus::WAITING)
            ->where('is_checked_in', false)
            ->where(function ($query) use ($deadlineDate, $deadlineTime) {
                $query->where('start_date', '<', $deadlineDate)
                    ->orWhere(function ($nested) use ($deadlineDate, $deadlineTime) {
                        $nested->whereDate('start_date', $deadlineDate)
                            ->where('start_time', '<=', $deadlineTime);
                    });
            })
            ->orderBy('id')
            ->chunkById(50, function (Collection $bookings) use (&$processed, &$banned) {
                foreach ($bookings as $booking) {
                    $result = $this->markBookingNoShow($booking);
                    if ($result === null) {
                        continue;
                    }

                    $processed++;
                    if ($result['ban_created']) {
                        $banned++;
                    }
                }
            });

        return ['processed' => $processed, 'banned' => $banned];
    }

    /**
     * @return array{no_show_count: int, ban_created: bool, ban: ?CustomerBan}|null
     */
    public function markBookingNoShow(Booking $booking): ?array
    {
        return DB::transaction(function () use ($booking) {
            $locked = Booking::query()->whereKey($booking->id)->lockForUpdate()->first();
            if ($locked === null) {
                return null;
            }

            if ($locked->session_status !== SessionStatus::WAITING || $locked->is_checked_in) {
                return null;
            }

            if (in_array($locked->booking_status, BookingStatus::inactiveStatuses(), true)) {
                return null;
            }

            $locked->update([
                'booking_status' => BookingStatus::CANCELLED,
                'session_status' => SessionStatus::NO_SHOW,
                'cancelled_at' => now(),
            ]);

            $identity = $this->resolveIdentity($locked);
            if ($identity['phone_normalized'] === null) {
                return [
                    'no_show_count' => 0,
                    'ban_created' => false,
                    'ban' => null,
                ];
            }

            $counter = CustomerNoShowCounter::query()
                ->where('phone_normalized', $identity['phone_normalized'])
                ->lockForUpdate()
                ->first();

            if ($counter === null) {
                $counter = CustomerNoShowCounter::create([
                    'phone_normalized' => $identity['phone_normalized'],
                    'user_id' => $identity['user_id'],
                    'no_show_count' => 0,
                ]);
            } elseif ($identity['user_id'] !== null && $counter->user_id === null) {
                $counter->update(['user_id' => $identity['user_id']]);
            }

            $nextCount = $counter->no_show_count + 1;
            $ban = null;
            $banCreated = false;

            if ($nextCount >= self::BAN_THRESHOLD) {
                $ban = $this->createBan(
                    phoneNormalized: $identity['phone_normalized'],
                    userId: $identity['user_id'],
                    customerName: $identity['name'],
                    noShowCount: $nextCount,
                    triggerBookingId: $locked->id,
                );
                $counter->update(['no_show_count' => 0]);
                $banCreated = true;
            } else {
                $counter->update(['no_show_count' => $nextCount]);
            }

            if ($identity['user_id'] !== null) {
                $this->notifyNoShow($identity['user_id'], $locked, $ban);
            }

            return [
                'no_show_count' => $banCreated ? 0 : $nextCount,
                'ban_created' => $banCreated,
                'ban' => $ban,
            ];
        });
    }

    public function liftBan(CustomerBan $ban, User $staff, ?string $note = null): CustomerBan
    {
        if (! $ban->isCurrentlyActive()) {
            throw ValidationException::withMessages([
                'ban' => ['الحظر منتهٍ أو مُرفوع مسبقاً.'],
            ]);
        }

        $ban->update([
            'active' => false,
            'lifted_at' => now(),
            'lifted_by' => $staff->id,
            'lift_note' => $note ?? 'فك حظر يدوي من موظف الاستقبال',
        ]);

        return $ban->fresh(['liftedByUser']);
    }

    public function expireStaleBans(): int
    {
        return CustomerBan::query()
            ->where('active', true)
            ->whereNull('lifted_at')
            ->where('banned_until', '<=', now())
            ->update(['active' => false]);
    }

    public function blockMessage(?CustomerBan $ban = null): string
    {
        if ($ban === null) {
            return 'حسابك محظور مؤقتاً من الحجز عبر التطبيق.';
        }

        $until = $ban->banned_until
            ->timezone(config('app.timezone'))
            ->locale('ar')
            ->translatedFormat('Y-m-d H:i');

        return "حسابك محظور من الحجز عبر التطبيق حتى {$until} بسبب تكرار عدم الحضور.";
    }

    /**
     * @return array{user_id: ?int, phone: ?string, phone_normalized: ?string, name: ?string}
     */
    public function resolveIdentity(Booking $booking): array
    {
        $user = $booking->user_id
            ? User::query()->find($booking->user_id)
            : null;

        $phone = $booking->visitor_phone ?: $user?->phone;
        $phoneNormalized = PhoneNormalizer::normalize($phone);

        return [
            'user_id' => $user?->id ?? $booking->user_id,
            'phone' => $phone,
            'phone_normalized' => $phoneNormalized,
            'name' => $booking->visitor_name ?: $user?->full_name,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function banPayload(CustomerBan $ban, bool $isActive): array
    {
        return [
            'id' => $ban->id,
            'phone' => $ban->phone_normalized,
            'phone_key' => $ban->phone_normalized,
            'name' => $ban->customer_name ?? '',
            'no_show_count' => $ban->no_show_count,
            'banned_at' => $ban->banned_at?->toIso8601String(),
            'banned_until' => $ban->banned_until?->toIso8601String(),
            'active' => $ban->active,
            'is_active' => $isActive,
            'lifted_at' => $ban->lifted_at?->toIso8601String(),
            'reason' => $ban->reason,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function customerStatusPayload(User $user): array
    {
        $ban = $this->getActiveBanForUser($user);
        $phoneKey = PhoneNormalizer::normalize($user->phone);

        return [
            'is_banned' => $ban !== null,
            'no_show_count' => $phoneKey ? $this->getNoShowCount($user->phone) : 0,
            'ban_threshold' => self::BAN_THRESHOLD,
            'grace_minutes' => self::GRACE_MINUTES,
            'ban_duration_days' => self::BAN_DAYS,
            'message' => $ban ? $this->blockMessage($ban) : null,
            'ban' => $ban ? $this->banPayload($ban, true) : null,
        ];
    }

    private function createBan(
        string $phoneNormalized,
        ?int $userId,
        ?string $customerName,
        int $noShowCount,
        int $triggerBookingId,
    ): CustomerBan {
        $now = now();
        $bannedUntil = $now->copy()->addDays(self::BAN_DAYS);

        CustomerBan::query()
            ->where('phone_normalized', $phoneNormalized)
            ->where('active', true)
            ->whereNull('lifted_at')
            ->update(['active' => false]);

        return CustomerBan::create([
            'phone_normalized' => $phoneNormalized,
            'user_id' => $userId,
            'customer_name' => $customerName,
            'no_show_count' => $noShowCount,
            'banned_at' => $now,
            'banned_until' => $bannedUntil,
            'active' => true,
            'reason' => self::BAN_THRESHOLD.'_no_shows',
            'trigger_booking_id' => $triggerBookingId,
        ]);
    }

    private function notifyNoShow(int $userId, Booking $booking, ?CustomerBan $ban): void
    {
        if ($ban !== null) {
            CustomerNotification::create([
                'user_id' => $userId,
                'type' => 'booking_ban',
                'title' => 'حظر مؤقت من الحجز',
                'body' => $this->blockMessage($ban),
                'payload' => [
                    'booking_id' => $booking->id,
                    'ban_id' => $ban->id,
                    'banned_until' => $ban->banned_until?->toIso8601String(),
                ],
            ]);

            return;
        }

        CustomerNotification::create([
            'user_id' => $userId,
            'type' => 'booking_no_show',
            'title' => 'إلغاء الحجز لعدم الحضور',
            'body' => 'تم إلغاء حجزك تلقائياً لعدم الحضور خلال '.self::GRACE_MINUTES.' دقيقة من الموعد.',
            'payload' => [
                'booking_id' => $booking->id,
                'booking_number' => $booking->booking_number,
            ],
        ]);
    }
}
