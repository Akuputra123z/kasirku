<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'midtrans_transaction_id',
        'payment_type',
        'bank',
        'va_number',
        'gross_amount',
        'status',
        'raw_response',
    ];

    protected $casts = [
        'gross_amount' => 'float',
        'raw_response' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
