<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesManagerStation;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManagerEmployeeController extends Controller
{
    use ResolvesManagerStation;

    public function index(Request $request): JsonResponse
    {
        $station = $this->resolveManagerStation($request->user());

        if (! $station) {
            return $this->managerStationMissingResponse();
        }

        $employees = User::query()
            ->where('station_id', $station->id)
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['reception', 'maintenance']))
            ->with('roles')
            ->orderBy('full_name')
            ->get();

        $pendingInvitations = Invitation::query()
            ->where('station_id', $station->id)
            ->whereIn('role', ['reception', 'maintenance'])
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Invitation $inv) => [
                'id' => 'invite-'.$inv->id,
                'invitation_id' => $inv->id,
                'full_name' => $inv->name,
                'email' => $inv->email,
                'role' => $inv->role,
                'shift' => $inv->shift,
                'station_name' => $inv->station_name,
                'status' => 'pending_invite',
                'account_status' => 'pending',
                'created_at' => $inv->created_at?->toIso8601String(),
                'expires_at' => $inv->expires_at?->toIso8601String(),
                'register_link' => rtrim((string) config('app.frontend_url'), '/').'/employees/invite/'.$inv->token,
            ]);

        return response()->json([
            'employees' => UserResource::collection($employees)->resolve(),
            'pending_invitations' => $pendingInvitations,
        ]);
    }

    public function update(Request $request, User $employee): JsonResponse
    {
        $station = $this->resolveManagerStation($request->user());

        if (! $station || (int) $employee->station_id !== (int) $station->id) {
            return response()->json(['message' => 'الموظف غير موجود'], 404);
        }

        if (! $employee->hasAnyRole(['reception', 'maintenance'])) {
            return response()->json(['message' => 'لا يمكن تعديل هذا الحساب'], 403);
        }

        $validated = $request->validate([
            'work_shift' => 'sometimes|in:morning,evening',
            'account_status' => 'sometimes|in:active,inactive,suspended',
        ]);

        $employee->update($validated);
        $employee->load(['roles', 'station']);

        return response()->json([
            'message' => 'تم تحديث بيانات الموظف',
            'employee' => (new UserResource($employee))->resolve(),
        ]);
    }

    public function destroyInvitation(Request $request, Invitation $invitation): JsonResponse
    {
        $station = $this->resolveManagerStation($request->user());

        if (! $station || (int) $invitation->station_id !== (int) $station->id) {
            return response()->json(['message' => 'الدعوة غير موجودة'], 404);
        }

        if (! in_array($invitation->role, ['reception', 'maintenance'], true)) {
            return response()->json(['message' => 'لا يمكن إلغاء هذه الدعوة'], 403);
        }

        if ($invitation->used_at !== null) {
            return response()->json(['message' => 'تم استخدام هذه الدعوة مسبقاً'], 400);
        }

        $invitation->delete();

        return response()->json([
            'message' => 'تم إلغاء الدعوة — يمكنك إرسال دعوة ببريد جديد',
        ]);
    }
}
