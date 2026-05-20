<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionDetail extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = [
        'tenant_id', 'product_name', 'transaction_id', 'product_id', 'variant_name',
        'extras_selected', 'quantity', 'price', 'subtotal', 'notes',
    ];

    protected $casts = [
        'extras_selected' => 'array',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
