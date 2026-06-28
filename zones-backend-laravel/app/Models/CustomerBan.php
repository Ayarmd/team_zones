<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerBan extends Model
{
    protected $fillable = [
        'phone_normalized',
        'user_id',
        'customer_name',
        'no_show_count',
        'banned_at',
        'banned_until',
        'active',
        'lifted_at',
        'lifted_by',
        'lift_note',
        'reason',
        'trigger_booking_id',
    ];

    protected function casts(): array
    {
        return [
            'no_show_count' => 'integer',
            'banned_at' => 'datetime',
            'banned_until' => 'datetime',
            'active' => 'boolean',
            'lifted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function liftedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lifted_by');
    }

    public function triggerBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'trigger_booking_id');
    }

    public function isCurrentlyActive(): bool
    {
        return $this->active
            && $this->lifted_at === null
            && $this->banned_until->isFuture();
    }
}
