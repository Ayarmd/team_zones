<?php

namespace App\Services;

use App\Models\CustomerNotification;
use App\Models\DeviceToken;
use App\Models\StaffNotification;
use App\Models\Station;
use App\Models\StationAlert;
use App\Models\User;
use App\Support\NotificationTargetAudience;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class NotificationTargetingService
{
    public function __construct(
        private readonly FcmPushService $fcm,
    ) {}

    /**
     * @return array{
     *     recipients: int,
     *     customer_notifications: int,
     *     staff_notifications: int,
     *     fcm_sent: int,
     *     fcm_failed: int,
     *     fcm_skipped: int,
     *     valid_tokens: int,
     *     fcm_reason: string|null
     * }
     */
    public function dispatchStationAlert(StationAlert $alert): array
    {
        Log::info('station_alert.dispatch.start', [
            'station_alert_id' => $alert->id,
            'station_id' => $alert->station_id,
            'target_audience' => $alert->target_audience,
        ]);

        try {
            $users = $this->resolveRecipients($alert->station, $alert->target_audience);

            $payload = [
                'station_alert_id' => $alert->id,
                'station_id' => $alert->station_id,
                'station_name' => $alert->station?->name,
                'severity' => $alert->severity,
                'target_audience' => $alert->target_audience,
                'alternative_instructions' => $alert->alternative_instructions,
            ];

            $customerCount = 0;
            $staffCount = 0;

            DB::transaction(function () use ($alert, $users, $payload, &$customerCount, &$staffCount) {
                foreach ($users as $user) {
                    if ($user->hasRole('customer')) {
                        CustomerNotification::create([
                            'user_id' => $user->id,
                            'type' => 'station_alert',
                            'title' => $alert->name,
                            'body' => $alert->body,
                            'payload' => $payload,
                        ]);
                        $customerCount++;
                    }

                    if ($user->hasAnyRole(['reception', 'maintenance', 'manager'])) {
                        StaffNotification::create([
                            'user_id' => $user->id,
                            'station_id' => $alert->station_id,
                            'station_alert_id' => $alert->id,
                            'type' => 'station_alert',
                            'title' => $alert->name,
                            'body' => $alert->body,
                            'payload' => $payload,
                        ]);
                        $staffCount++;
                    }
                }
            });

            $userIds = $users->pluck('id');

            $tokenRows = DeviceToken::query()
                ->whereIn('user_id', $userIds)
                ->whereNotNull('token')
                ->where('token', '!=', '')
                ->get(['user_id', 'token']);

            $tokens = $tokenRows
                ->pluck('token')
                ->map(fn ($token) => trim((string) $token))
                ->filter()
                ->unique()
                ->values()
                ->all();

            Log::info('station_alert.dispatch.tokens', [
                'station_alert_id' => $alert->id,
                'recipient_user_ids' => $userIds->take(20)->values()->all(),
                'users_with_tokens' => $tokenRows->pluck('user_id')->unique()->count(),
                'valid_token_count' => count($tokens),
                'sample_token_prefixes' => collect($tokens)->take(3)->map(fn ($t) => substr($t, 0, 16))->all(),
            ]);

            $fcmResult = ['sent' => 0, 'failed' => 0, 'skipped' => count($tokens), 'reason' => 'no_tokens'];

            if ($tokens !== []) {
                $fcmResult = $this->fcm->sendToTokens($tokens, $alert->name, $alert->body, [
                    'type' => 'station_alert',
                    'station_alert_id' => (string) $alert->id,
                    'station_id' => (string) $alert->station_id,
                    'severity' => $alert->severity,
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ]);
            }

            Log::info('station_alert.dispatch.complete', [
                'station_alert_id' => $alert->id,
                'recipients' => $users->count(),
                'customer_notifications' => $customerCount,
                'staff_notifications' => $staffCount,
                'fcm' => $fcmResult,
            ]);

            return [
                'recipients' => $users->count(),
                'customer_notifications' => $customerCount,
                'staff_notifications' => $staffCount,
                'fcm_sent' => $fcmResult['sent'],
                'fcm_failed' => $fcmResult['failed'],
                'fcm_skipped' => $fcmResult['skipped'],
                'valid_tokens' => count($tokens),
                'fcm_reason' => $fcmResult['reason'] ?? null,
            ];
        } catch (Throwable $e) {
            Log::error('station_alert.dispatch.failed', [
                'station_alert_id' => $alert->id,
                'station_id' => $alert->station_id,
                'target_audience' => $alert->target_audience,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * @return Collection<int, User>
     */
    public function resolveRecipients(Station $station, string $targetAudience): Collection
    {
        $normalizedAudience = NotificationTargetAudience::normalize($targetAudience);
        $roles = NotificationTargetAudience::rolesFor($normalizedAudience);
        $users = collect();

        Log::info('station_alert.resolve_recipients.start', [
            'target_audience' => $targetAudience,
            'normalized_audience' => $normalizedAudience,
            'roles' => $roles,
            'station_id' => $station->id,
        ]);

        foreach ($roles as $role) {
            $query = User::role($role, 'web');

            if (NotificationTargetAudience::roleRequiresStation($role)) {
                $query->where('station_id', $station->id);
            }

            Log::info('station_alert.resolve_recipients.role_query', [
                'role' => $role,
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings(),
                'count' => (clone $query)->count(),
                'sample_user_ids' => (clone $query)->limit(10)->pluck('id')->all(),
            ]);

            $users = $users->merge($query->get());
        }

        $unique = $users->unique('id')->values();

        Log::info('station_alert.resolve_recipients.complete', [
            'target_audience' => $normalizedAudience,
            'total_recipients' => $unique->count(),
            'sample_user_ids' => $unique->take(20)->pluck('id')->all(),
        ]);

        return $unique;
    }
}
