<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StationAlert;
use App\Models\User;
use App\Services\NotificationTargetingService;
use App\Support\NotificationTargetAudience;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ManagerAlertController extends Controller
{
    public function __construct(
        private readonly NotificationTargetingService $targeting,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $this->manager($request);
        $stationId = $user->resolvedStationId();

        if (! $stationId) {
            return response()->json(['message' => 'لا توجد صالة مرتبطة'], 404);
        }

        $status = $request->query('status', 'active');
        if ($status === 'archived') {
            $status = 'stopped';
        }

        $alerts = StationAlert::query()
            ->where('station_id', $stationId)
            ->when($status === 'active', fn ($q) => $q->active())
            ->when($status === 'stopped', fn ($q) => $q->archived())
            ->when($status !== 'all' && ! in_array($status, ['active', 'stopped'], true), fn ($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (StationAlert $alert) => $this->mapAlert($alert));

        return response()->json(['alerts' => $alerts]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->manager($request);
        $station = $user->resolvedStation();

        if (! $station) {
            return response()->json(['message' => 'لا توجد صالة مرتبطة'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'situation_description' => 'required|string|max:5000',
            'target_audience' => 'required|string|max:64',
            'severity' => 'nullable|in:low,medium,high,critical',
            'alternative_instructions' => 'nullable|string|max:2000',
        ]);

        try {
            $validated['target_audience'] = NotificationTargetAudience::normalize($validated['target_audience']);
        } catch (\InvalidArgumentException) {
            throw ValidationException::withMessages([
                'target_audience' => ['جمهور مستهدف غير صالح'],
            ]);
        }

        if (! NotificationTargetAudience::isValid($validated['target_audience'])) {
            throw ValidationException::withMessages([
                'target_audience' => ['جمهور مستهدف غير صالح'],
            ]);
        }

        if (! NotificationTargetAudience::isSelectable($validated['target_audience'])) {
            throw ValidationException::withMessages([
                'target_audience' => ['يجب اختيار مستهدف محدد: الجميع، الزبون، موظف الاستقبال، أو موظف الصيانة'],
            ]);
        }

        $result = DB::transaction(function () use ($validated, $user, $station) {
            $alert = StationAlert::create([
                'station_id' => $station->id,
                'created_by' => $user->id,
                'name' => $validated['name'],
                'body' => $validated['situation_description'],
                'target_audience' => $validated['target_audience'],
                'severity' => $validated['severity'] ?? 'medium',
                'status' => 'active',
                'alternative_instructions' => $validated['alternative_instructions'] ?? null,
                'starts_at' => now(),
            ]);

            $alert->setRelation('station', $station);
            $delivery = $this->targeting->dispatchStationAlert($alert);

            return compact('alert', 'delivery');
        });

        return response()->json([
            'message' => 'تم إرسال التنبيه للمستهدفين',
            'alert' => $this->mapAlert($result['alert']),
            'delivery' => $result['delivery'],
        ], 201);
    }

    public function stop(Request $request, StationAlert $alert): JsonResponse
    {
        return $this->archive($request, $alert);
    }

    public function archive(Request $request, StationAlert $alert): JsonResponse
    {
        $user = $this->manager($request);
        $stationId = $user->resolvedStationId();

        if (! $stationId || (int) $alert->station_id !== (int) $stationId) {
            return response()->json(['message' => 'التنبيه غير موجود'], 404);
        }

        if ($alert->status !== 'active') {
            throw ValidationException::withMessages([
                'alert' => ['التنبيه مؤرشف بالفعل'],
            ]);
        }

        $alert->update([
            'status' => 'stopped',
            'ends_at' => now(),
        ]);

        return response()->json([
            'message' => 'تم أرشفة التنبيه',
            'alert' => $this->mapAlert($alert->fresh()),
        ]);
    }

    private function mapAlert(StationAlert $alert): array
    {
        return [
            'id' => $alert->id,
            'name' => $alert->name,
            'body' => $alert->body,
            'situationDescription' => $alert->body,
            'targetAudience' => $alert->target_audience,
            'target_audience' => $alert->target_audience,
            'severity' => $alert->severity,
            'status' => $alert->status,
            'is_archived' => $alert->status === 'stopped',
            'isArchived' => $alert->status === 'stopped',
            'alternativeInstructions' => $alert->alternative_instructions ?? '',
            'alternative_instructions' => $alert->alternative_instructions ?? '',
            'startDate' => $alert->starts_at?->toIso8601String(),
            'endDate' => $alert->ends_at?->toIso8601String(),
            'createdAt' => $alert->created_at?->toIso8601String(),
            'source' => 'api',
        ];
    }

    private function manager(Request $request): User
    {
        $user = $request->user();
        if (! $user instanceof User || ! $user->hasRole('manager')) {
            abort(403, 'غير مصرح');
        }

        return $user;
    }
}
