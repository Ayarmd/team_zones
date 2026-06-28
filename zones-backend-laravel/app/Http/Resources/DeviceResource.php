<?php



namespace App\Http\Resources;



use App\Models\Device;

use Illuminate\Http\Request;

use Illuminate\Http\Resources\Json\JsonResource;



class DeviceResource extends JsonResource

{

    /** @var Device */

    public $resource;



    public function toArray(Request $request): array

    {

        $device = $this->resource;

        $openFault = $device->relationLoaded('openFault') ? $device->openFault : null;

        $status = $device->operational_status;



        return [

            'id' => $device->id,

            'station_id' => $device->station_id,

            'package_id' => $device->package_id,

            'device_code' => $device->device_code,

            'display_name' => $device->display_name,

            'name' => $device->display_name,

            'device_type' => $device->device_type,

            'type' => $device->device_type,

            'operational_status' => $status,

            'is_active' => $status === 'active',

            'is_maintenance' => $status === 'maintenance',

            'has_fault' => in_array($status, ['maintenance', 'inactive'], true),

            'maintenance_in_progress' => $openFault?->status === 'in_progress',

            'average_rating' => (float) $device->average_rating,

            'notes' => $device->notes,

            'sessions_this_month' => (int) ($device->sessions_this_month_count ?? 0),

            'last_session_at' => $device->last_session_ended_at
                ? (string) $device->last_session_ended_at
                : null,

            'created_at' => $device->created_at?->toIso8601String(),

            'updated_at' => $device->updated_at?->toIso8601String(),

        ];

    }

}

