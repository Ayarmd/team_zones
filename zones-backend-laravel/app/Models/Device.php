<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Device extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'station_id',
        'package_id',
        'device_code',
        'display_name',
        'device_type',
        'operational_status',
        'average_rating',
        'ratings_count',
        'notes',
        'last_maintenance_at',
    ];

    protected function casts(): array
    {
        return [
            'average_rating' => 'decimal:2',
            'last_maintenance_at' => 'datetime',
        ];
    }

    public function station(): BelongsTo
    {
        return $this->belongsTo(Station::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function faults(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(DeviceFault::class);
    }

    public function openFault(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(DeviceFault::class)
            ->where('archived', false)
            ->whereIn('status', ['pending', 'in_progress'])
            ->latestOfMany();
    }

    public function bookings(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function scopeWithSessionStats($query)
    {
        $start = now()->startOfMonth();
        $end = now()->endOfMonth();

        return $query
            ->withCount(['bookings as sessions_this_month_count' => function ($q) use ($start, $end) {
                $q->where('session_status', 'finished')
                    ->whereNotNull('session_ended_at')
                    ->whereBetween('session_ended_at', [$start, $end]);
            }])
            ->withMax(['bookings as last_session_ended_at' => function ($q) {
                $q->where('session_status', 'finished')->whereNotNull('session_ended_at');
            }], 'session_ended_at');
    }
}
