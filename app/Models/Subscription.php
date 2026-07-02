<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'tenant_id',
        'package',
        'amount',
        'midtrans_order_id',
        'midtrans_transaction_id',
        'payment_method',
        'payment_payload',
        'status',
        'started_at',
        'expires_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'started_at' => 'datetime',
            'expires_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'payment_payload' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'paid')->where('expires_at', '>', now());
    }
}
