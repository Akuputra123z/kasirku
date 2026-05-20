<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductExtra extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = ['tenant_id', 'product_id', 'name', 'price'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
