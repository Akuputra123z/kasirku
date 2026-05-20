<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    use HasTenant;

    protected $fillable = ['tenant_id', 'stock', 'sku', 'product_id', 'name', 'additional_price'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
