<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ManagerInvitationMail;
use App\Mail\ManagerRejectionMail;
use App\Models\HallJoinRequest;
use App\Models\Invitation;
use App\Models\Station;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class HallJoinRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'hall_name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'map_link' => 'required|url|max:500',
            'email' => 'required|email|max:255',
            'manager_name' => 'required|string|max:255',
            'commercial_phone' => 'required|string|max:20',
            'images' => 'nullable|array|max:5',
            'images.*' => 'nullable|string',
        ]);

        $email = Str::lower(trim($request->email));
        $hallName = trim($request->hall_name);
        $managerName = trim($request->manager_name);

        $joinRequest = HallJoinRequest::create([
            'hall_name' => $hallName,
            'address' => trim($request->address),
            'city' => $this->extractCity(trim($request->address)),
            'map_link' => trim($request->map_link),
            'manager_email' => $email,
            'manager_name' => $managerName,
            'commercial_phone' => trim($request->commercial_phone),
            'images' => collect($request->images ?? [])->take(5)->values()->all(),
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Join request submitted successfully',
            'request' => $this->formatRequest($joinRequest),
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        if ($denied = $this->ensureSuperAdmin($request)) {
            return $denied;
        }

        $requests = HallJoinRequest::query()
            ->latest()
            ->get()
            ->map(fn (HallJoinRequest $item) => $this->formatRequest($item));

        return response()->json([
            'requests' => $requests,
        ]);
    }

    public function accept(Request $request, HallJoinRequest $hallJoinRequest): JsonResponse
    {
        if ($denied = $this->ensureSuperAdmin($request)) {
            return $denied;
        }

        if ($hallJoinRequest->status !== 'pending') {
            return response()->json([
                'message' => 'This request was already processed',
            ], 422);
        }

        $request->validate([
            'admin_notes' => 'nullable|string|max:2000',
        ]);

        [$invitation, $registrationUrl] = DB::transaction(function () use ($request, $hallJoinRequest) {
            $slug = $this->uniqueStationSlug($hallJoinRequest->hall_name);

            $station = Station::create([
                'name' => $hallJoinRequest->hall_name,
                'slug' => $slug,
                'phone' => $hallJoinRequest->commercial_phone,
                'email' => $hallJoinRequest->manager_email,
                'city' => $hallJoinRequest->city ?? 'Tripoli',
                'address' => $hallJoinRequest->address,
                'cover_image' => null,
                'is_active' => false,
                'bookings_enabled' => false,
                'is_published' => false,
            ]);

            $hallJoinRequest->update([
                'status' => 'accepted',
                'admin_notes' => $request->input('admin_notes'),
                'station_id' => $station->id,
                'accepted_at' => now(),
            ]);

            Invitation::where('email', $hallJoinRequest->manager_email)
                ->whereNull('used_at')
                ->delete();

            $token = Str::random(64);

            $invitation = Invitation::create([
                'name' => $hallJoinRequest->manager_name,
                'station_name' => $hallJoinRequest->hall_name,
                'email' => $hallJoinRequest->manager_email,
                'role' => 'manager',
                'token' => $token,
                'invited_by' => $request->user()->id,
                'hall_join_request_id' => $hallJoinRequest->id,
                'station_id' => $station->id,
                'expires_at' => now()->addDay(),
            ]);

            $url = rtrim(config('app.frontend_url'), '/').'/manager/complete-registration/'.$invitation->token;

            return [$invitation, $url];
        });

        // Send mail OUTSIDE transaction so DB is already committed
        $mailError = null;
        $mailDelivered = config('mail.default') !== 'log';
        \Log::info('[ACCEPT] sending invitation mail', [
            'request_id' => $hallJoinRequest->id,
            'recipient' => $hallJoinRequest->manager_email,
            'mailer' => config('mail.default'),
            'from' => config('mail.from.address'),
        ]);
        if ($mailDelivered) {
            try {
                Mail::to($hallJoinRequest->manager_email)->send(new ManagerInvitationMail(
                    managerName: $hallJoinRequest->manager_name,
                    hallName: $hallJoinRequest->hall_name,
                    registrationUrl: $registrationUrl,
                ));
                \Log::info('[ACCEPT] invitation mail SENT OK to '.$hallJoinRequest->manager_email);
            } catch (\Throwable $e) {
                $mailError = $e->getMessage();
                \Log::error('[ACCEPT] ManagerInvitationMail FAILED: '.$mailError);
            }
        }

        $hallJoinRequest->refresh();

        return response()->json([
            'message' => $mailDelivered && ! $mailError
                ? 'Request accepted and invitation sent'
                : 'Request accepted — copy registration link and send manually',
            'request' => $this->formatRequest($hallJoinRequest),
            'registration_url' => $registrationUrl,
            'mail_sent' => $mailDelivered && $mailError === null,
            'mail_error' => $mailError,
        ]);
    }

    public function reject(Request $request, HallJoinRequest $hallJoinRequest): JsonResponse
    {
        if ($denied = $this->ensureSuperAdmin($request)) {
            return $denied;
        }

        if ($hallJoinRequest->status !== 'pending') {
            return response()->json([
                'message' => 'This request was already processed',
            ], 422);
        }

        $request->validate([
            'reason' => 'required|string|max:2000',
        ]);

        $reason = trim($request->reason);

        $hallJoinRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'rejected_at' => now(),
        ]);

        \Log::info('[REJECT] sending rejection mail', [
            'request_id' => $hallJoinRequest->id,
            'recipient' => $hallJoinRequest->manager_email,
        ]);
        try {
            Mail::to($hallJoinRequest->manager_email)->send(new ManagerRejectionMail(
                managerName: $hallJoinRequest->manager_name,
                hallName: $hallJoinRequest->hall_name,
                reason: $reason,
            ));
            \Log::info('[REJECT] rejection mail SENT OK to '.$hallJoinRequest->manager_email);
        } catch (\Throwable $e) {
            \Log::error('[REJECT] ManagerRejectionMail FAILED: '.$e->getMessage());
        }

        return response()->json([
            'message' => 'Request rejected',
            'request' => $this->formatRequest($hallJoinRequest->fresh()),
        ]);
    }

    private function ensureSuperAdmin(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('super_admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return null;
    }

    private function formatRequest(HallJoinRequest $request): array
    {
        return [
            'id' => $request->id,
            'hall_name' => $request->hall_name,
            'hallName' => $request->hall_name,
            'address' => $request->address,
            'city' => $request->city,
            'map_link' => $request->map_link,
            'mapLink' => $request->map_link,
            'manager_email' => $request->manager_email,
            'managerEmail' => $request->manager_email,
            'manager_name' => $request->manager_name,
            'managerName' => $request->manager_name,
            'commercial_phone' => $request->commercial_phone,
            'commercialPhone' => $request->commercial_phone,
            'images' => $request->images ?? [],
            'status' => $request->status,
            'commission_rate' => $request->commission_rate,
            'commissionRate' => $request->commission_rate,
            'admin_notes' => $request->admin_notes,
            'rejection_reason' => $request->rejection_reason,
            'submitted_at' => $request->created_at?->toDateString(),
            'submittedAt' => $request->created_at?->toDateString(),
            'accepted_at' => $request->accepted_at?->toIso8601String(),
            'acceptedAt' => $request->accepted_at?->toIso8601String(),
            'rejected_at' => $request->rejected_at?->toIso8601String(),
            'rejectedAt' => $request->rejected_at?->toIso8601String(),
            'station_id' => $request->station_id,
        ];
    }

    private function deriveManagerName(string $email, string $hallName): string
    {
        $local = Str::before($email, '@');
        $name = Str::headline(str_replace(['.', '_', '-'], ' ', $local));

        return $name !== '' ? $name : $hallName;
    }

    private function extractCity(string $address): ?string
    {
        $parts = array_values(array_filter(array_map('trim', preg_split('/[,،\-]/u', $address) ?: [])));

        return $parts[0] ?? null;
    }

    private function uniqueStationSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'station';
        $slug = $base;
        $i = 1;

        while (Station::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
