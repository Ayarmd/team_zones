<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DeviceResource;
use App\Http\Resources\PackageResource;
use App\Models\Device;
use App\Models\Package;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffHallCatalogController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->hasAnyRole(['manager', 'reception', 'maintenance'])) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        $stationId = $user->resolvedStationId();
        if (! $stationId) {
            return response()->json(['message' => 'لا توجد صالة مرتبطة بهذا الحساب'], 404);
        }

        $packages = Package::query()
            ->where('station_id', $stationId)
            ->orderBy('name')
            ->get();

        $devices = Device::query()
            ->with(['openFault'])
            ->withSessionStats()
            ->where('station_id', $stationId)
            ->orderBy('display_name')
            ->get();

        return response()->json([
            'packages' => PackageResource::collection($packages)->resolve(),
            'devices' => DeviceResource::collection($devices)->resolve(),
        ]);
    }
}
