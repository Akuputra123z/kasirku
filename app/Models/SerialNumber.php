<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SerialNumber extends Model
{
    use HasTenant;

    protected $fillable = [
        'tenant_id',
        'product_id',
        'serial_number',
        'status',
        'transaction_detail_id',
        'supplier_id',
        'purchased_at',
        'sold_at',
    ];

    protected $casts = [
        'purchased_at' => 'date',
        'sold_at' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function transactionDetail(): BelongsTo
    {
        return $this->belongsTo(TransactionDetail::class);
    }
}
