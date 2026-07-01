<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Mail\EmployeeInvitationMail;
use App\Models\Invitation;
use App\Models\Station;
use App\Models\User;
use App\Support\WorkShiftSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    private const ROLE_LABELS = [
        'reception' => 'موظف استقبال',
        'maintenance' => 'موظف صيانة',
        'manager' => 'مدير صالة',
    ];

    public function sendInvitation(Request $request): JsonResponse
    {
        $user = $request->user();

        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'role' => 'required|string',
        ];

        if ($user->hasRole('super_admin')) {
            $rules['station_name'] = 'required|string|max:255';
        }

        if ($user->hasRole('manager')) {
            $rules['shift'] = 'required|in:morning,evening';
        }

        $request->validate($rules);

        if ($user->hasRole('super_admin') && $request->role !== 'manager') {
            return response()->json([
                'message' => 'Super admin can invite managers only',
            ], 403);
        }

        if ($user->hasRole('manager') && ! in_array($request->role, ['reception', 'maintenance'], true)) {
            return response()->json([
                'message' => 'Manager can invite employees only',
            ], 403);
        }

        if (! $user->hasRole('super_admin') && ! $user->hasRole('manager')) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        if (User::where('email', $request->email)->exists()) {
            return response()->json([
                'message' => 'يوجد حساب مسجّل بهذا البريد الإلكتروني',
            ], 422);
        }

        $stationId = null;
        $stationName = $request->station_name;

        if ($user->hasRole('manager')) {
            $managerStation = Station::where('manager_id', $user->id)->first();

            if (! $managerStation) {
                return response()->json([
                    'message' => 'Manager has no assigned station',
                ], 403);
            }

            $stationId = $managerStation->id;
            $stationName = $managerStation->name;
        }

        $pendingInvite = Invitation::query()
            ->where('email', $request->email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($pendingInvite) {
            return response()->json([
                'message' => 'يوجد دعوة نشطة لهذا البريد الإلكتروني',
            ], 422);
        }

        $invitation = Invitation::create([
            'name' => $request->name,
            'station_name' => $stationName,
            'email' => $request->email,
            'role' => $request->role,
            'shift' => $request->shift,
            'token' => Str::random(64),
            'invited_by' => $user->id,
            'station_id' => $stationId,
            'expires_at' => now()->addDays(7),
        ]);

        $registrationUrl = $this->employeeRegistrationUrl($invitation);
        $mailError = null;
        $mailDelivered = config('mail.default') !== 'log';

        if (in_array($invitation->role, ['reception', 'maintenance'], true)) {
            if ($mailDelivered) {
                try {
                    Mail::to($invitation->email)->send(new EmployeeInvitationMail(
                        employeeName: $invitation->name,
                        roleLabel: self::ROLE_LABELS[$invitation->role] ?? $invitation->role,
                        hallName: $invitation->station_name ?? 'Zones',
                        shiftLabel: WorkShiftSchedule::workingHours($invitation->shift) ?? '—',
                        registrationUrl: $registrationUrl,
                    ));
                } catch (\Throwable $e) {
                    Log::error('employee_invitation_mail_failed', [
                        'invitation_id' => $invitation->id,
                        'error' => $e->getMessage(),
                    ]);
                    $mailError = 'تم إنشاء الدعوة لكن تعذر إرسال البريد. انسخ الرابط وأرسله يدوياً.';
                }
            }
        }

        return response()->json([
            'message' => $mailError
                ? $mailError
                : ($mailDelivered ? 'تم إرسال الدعوة بنجاح' : 'تم إنشاء الدعوة — انسخ الرابط وأرسله للموظف'),
            'invitation' => $invitation,
            'register_link' => $registrationUrl,
            'mail_sent' => $mailDelivered && $mailError === null,
        ], 201);
    }

    public function showByToken(string $token): JsonResponse
    {
        $invitation = Invitation::where('token', $token)->first();

        if (! $invitation) {
            return response()->json([
                'message' => 'Invalid invitation token',
            ], 404);
        }

        return response()->json([
            'invitation' => [
                'name' => $invitation->name,
                'email' => $invitation->email,
                'station_name' => $invitation->station_name,
                'hall_name' => $invitation->station_name,
                'role' => $invitation->role,
                'role_label' => self::ROLE_LABELS[$invitation->role] ?? $invitation->role,
                'shift' => $invitation->shift,
                'shift_label' => WorkShiftSchedule::workingHours($invitation->shift),
                'working_hours' => WorkShiftSchedule::workingHours($invitation->shift),
                'expired' => $invitation->expires_at < now(),
                'already_used' => $invitation->used_at !== null,
                'expires_at' => $invitation->expires_at,
                'is_employee' => in_array($invitation->role, ['reception', 'maintenance'], true),
            ],
        ]);
    }

    public function completeRegistration(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'phone' => 'required|string|max:20|unique:users,phone',
            'password' => 'required|min:6|confirmed',
        ]);

        $invitation = Invitation::where('token', $request->token)->first();

        if (! $invitation) {
            return response()->json([
                'message' => 'Invalid invitation token',
            ], 404);
        }

        if ($invitation->used_at !== null) {
            return response()->json([
                'message' => 'Invitation already used',
            ], 400);
        }

        if ($invitation->expires_at < now()) {
            return response()->json([
                'message' => 'Invitation expired',
            ], 400);
        }

        if (User::where('email', $invitation->email)->exists()) {
            return response()->json([
                'message' => 'An account with this email already exists',
            ], 422);
        }

        $user = DB::transaction(function () use ($request, $invitation) {
            $user = User::create([
                'full_name' => $invitation->name,
                'email' => $invitation->email,
                'phone' => trim($request->phone),
                'password' => $request->password,
                'account_status' => 'active',
                'station_id' => $invitation->station_id,
                'work_shift' => $invitation->shift,
            ]);

            $user->assignRole($invitation->role);

            $invitation->update([
                'used_at' => now(),
            ]);

            if ($invitation->station_id && $invitation->role === 'manager') {
                Station::where('id', $invitation->station_id)->update([
                    'manager_id' => $user->id,
                ]);
            }

            return $user;
        });

        $user->load(['roles', 'station']);

        if (in_array($invitation->role, ['reception', 'maintenance'], true)) {
            return response()->json([
                'message' => 'تم إنشاء الحساب بنجاح — يمكنك تسجيل الدخول الآن',
                'redirect_to_login' => true,
                'role' => $invitation->role,
                'user' => (new UserResource($user))->resolve(),
            ]);
        }

        $tokenName = $invitation->role === 'manager' ? 'manager_token' : 'auth_token';
        $token = $user->createToken($tokenName)->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
            'role' => $invitation->role,
        ]);
    }

    private function employeeRegistrationUrl(Invitation $invitation): string
    {
        if (in_array($invitation->role, ['reception', 'maintenance'], true)) {
            return rtrim(config('app.frontend_url'), '/').'/employees/invite/'.$invitation->token;
        }

        return rtrim(config('app.frontend_url'), '/').'/manager/complete-registration/'.$invitation->token;
    }
}
