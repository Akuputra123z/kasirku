<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderDetail extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = [
        'tenant_id',
        'purchase_order_id',
        'product_id',
        'quantity',
        'received_quantity',
        'unit_cost',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'received_quantity' => 'integer',
        'unit_cost' => 'float',
        'subtotal' => 'float',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
