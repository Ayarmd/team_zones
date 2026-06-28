<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesManagerStation;
use App\Http\Controllers\Controller;
use App\Http\Resources\DeviceResource;
use App\Models\Device;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ManagerDeviceController extends Controller
{
    use ResolvesManagerStation;

    public function index(Request $request): JsonResponse
    {
        $station = $this->resolveManagerStation($request->user());
        if (! $station) {
            return $this->managerStationMissingResponse();
        }

        $devices = Device::query()
            ->with(['openFault'])
            ->withSessionStats()
            ->where('station_id', $station->id)
            ->when($request->filled('package_id'), fn ($q) => $q->where('package_id', $request->integer('package_id')))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.trim($request->string('q')).'%';
                $q->where(function ($inner) use ($term) {
                    $inner->where('display_name', 'like', $term)
                        ->orWhere('device_code', 'like', $term);
                });
            })
            ->orderBy('display_name')
            ->get();

        return response()->json([
            'devices' => DeviceResource::collection($devices)->resolve(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $station = $this->resolveManagerStation($request->user());
        if (! $station) {
            return $this->managerStationMissingResponse();
        }

        $validated = $this->validateDevice($request);

        $device = Device::create([
            'station_id' => $station->id,
            ...$validated,
        ]);

        return response()->json([
            'message' => 'تم إضافة الجهاز',
            'device' => (new DeviceResource($device))->resolve(),
        ], 201);
    }

    public function update(Request $request, Device $device): JsonResponse
    {
        $station = $this->resolveManagerStation($request->user());
        if (! $station || (int) $device->station_id !== (int) $station->id) {
            return response()->json(['message' => 'الجهاز غير موجود'], 404);
        }

        $validated = $this->validateDevice($request, $device);

        $device->update($validated);

        return response()->json([
            'message' => 'تم تحديث الجهاز',
            'device' => (new DeviceResource($device->fresh()))->resolve(),
        ]);
    }

    public function destroy(Request $request, Device $device): JsonResponse
    {
        $station = $this->resolveManagerStation($request->user());
        if (! $station || (int) $device->station_id !== (int) $station->id) {
            return response()->json(['message' => 'الجهاز غير موجود'], 404);
        }

        $device->delete();

        return response()->json([
            'message' => 'تم حذف الجهاز',
        ]);
    }

  private function validateDevice(Request $request, ?Device $device = null): array
    {
        $station = $this->resolveManagerStation($request->user());

        $validated = $request->validate([
            'display_name' => 'sometimes|required|string|max:120',
            'name' => 'sometimes|required|string|max:120',
            'device_code' => [
                'sometimes',
                'required',
                'string',
                'max:40',
                Rule::unique('devices', 'device_code')
                    ->where(fn ($q) => $q->where('station_id', $station?->id))
                    ->ignore($device?->id),
            ],
            'device_type' => 'sometimes|required|in:ps5,pc,vr,xbox,simulator,vip',
            'type' => 'sometimes|required|in:ps5,pc,vr,xbox,simulator,vip',
            'package_id' => 'nullable|integer|exists:packages,id',
            'operational_status' => 'sometimes|in:active,maintenance,inactive',
            'notes' => 'nullable|string|max:2000',
        ]);

        $displayName = $validated['display_name'] ?? $validated['name'] ?? $device?->display_name;
        $deviceType = $validated['device_type'] ?? $validated['type'] ?? $device?->device_type;

        $packageId = $validated['package_id'] ?? $device?->package_id;
        if ($packageId !== null && $station) {
            $packageExists = Package::query()
                ->where('id', $packageId)
                ->where('station_id', $station->id)
                ->exists();
            if (! $packageExists) {
                throw ValidationException::withMessages([
                    'package_id' => ['الباقة غير موجودة في هذه الصالة'],
                ]);
            }
        }

        return array_filter([
            'display_name' => $displayName,
            'device_code' => $validated['device_code'] ?? $device?->device_code,
            'device_type' => $deviceType,
            'package_id' => $packageId,
            'operational_status' => $validated['operational_status'] ?? $device?->operational_status,
            'notes' => $validated['notes'] ?? $device?->notes,
        ], fn ($v) => $v !== null);
    }
}
