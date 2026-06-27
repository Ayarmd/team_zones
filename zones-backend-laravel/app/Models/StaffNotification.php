<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffNotification extends Model
{
    protected $fillable = [
        'user_id',
        'station_id',
        'station_alert_id',
        'type',
        'title',
        'body',
        'payload',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'payload' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function station(): BelongsTo
    {
        return $this->belongsTo(Station::class);
    }

    public function stationAlert(): BelongsTo
    {
        return $this->belongsTo(StationAlert::class, 'station_alert_id');
    }
}
