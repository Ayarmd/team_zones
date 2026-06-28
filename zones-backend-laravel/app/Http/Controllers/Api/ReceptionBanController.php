<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CustomerBan;
use App\Models\User;
use App\Services\CustomerBanService;
use App\Support\SessionStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceptionBanController extends Controller
{
    public function __construct(
        private readonly CustomerBanService $banService,
    ) {}

    public function bans(Request $request): JsonResponse
    {
        $this->staffUser($request);

        $bans = CustomerBan::query()
            ->with(['user', 'liftedByUser'])
            ->orderByDesc('banned_at')
            ->limit(100)
            ->get();

        $rows = $bans->map(function (CustomerBan $ban) {
            return $this->banService->banPayload($ban, $ban->isCurrentlyActive());
        })->values();

        return response()->json([
            'active_bans' => $rows->where('is_active', true)->values(),
            'history' => $rows->values(),
            'ban_threshold' => CustomerBanService::BAN_THRESHOLD,
            'ban_duration_days' => CustomerBanService::BAN_DAYS,
        ]);
    }

    public function noShows(Request $request): JsonResponse
    {
        $stationId = $this->staffStationId($request);

        $validated = $request->validate([
            'limit' => 'nullable|integer|min:1|max:200',
        ]);

        $limit = (int) ($validated['limit'] ?? 50);

        $bookings = Booking::query()
            ->where('station_id', $stationId)
            ->where('session_status', SessionStatus::NO_SHOW)
            ->with(['package', 'device'])
            ->orderByDesc('cancelled_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'no_shows' => $bookings->map(fn (Booking $booking) => $this->mapNoShowRow($booking))->values(),
        ]);
    }

    public function lift(Request $request, CustomerBan $ban): JsonResponse
    {
        $staff = $this->staffUser($request);

        $validated = $request->validate([
            'note' => 'nullable|string|max:500',
        ]);

        $lifted = $this->banService->liftBan($ban, $staff, $validated['note'] ?? null);

        return response()->json([
            'message' => 'تم رفع الحظر بنجاح.',
            'ban' => $this->banService->banPayload($lifted, false),
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

    private function staffStationId(Request $request): int
    {
        return (int) $this->staffUser($request)->resolvedStationId();
    }

    /**
     * @return array<string, mixed>
     */
    private function mapNoShowRow(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'booking_code' => $booking->booking_number,
            'visitor_name' => $booking->visitor_name ?? '',
            'phone' => $booking->visitor_phone ?? '',
            'email' => $booking->visitor_email ?? '',
            'date' => $booking->start_date?->format('Y-m-d'),
            'hour' => $booking->start_time,
            'device_id' => $booking->device_id,
            'package_name' => $booking->package?->name ?? '—',
            'source' => $booking->booking_source === 'mobile_app' ? 'app' : 'manual',
            'no_show_at' => $booking->cancelled_at?->toIso8601String(),
            'session_status' => $booking->session_status,
            'booking_status' => $booking->booking_status,
        ];
    }
}
