<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerNoShowCounter extends Model
{
    protected $fillable = [
        'phone_normalized',
        'user_id',
        'no_show_count',
    ];

    protected function casts(): array
    {
        return [
            'no_show_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
