<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PpobProduct extends Model
{
    protected $fillable = [
        'buyer_sku_code',
        'product_name',
        'category',
        'brand',
        'type',
        'seller_price',
        'buyer_price',
        'markup_type',
        'markup_value',
        'unlimited_stock',
        'stock',
        'multi',
        'start_cut_off',
        'end_cut_off',
        'description',
        'is_active',
        'synced_at',
    ];

    protected $casts = [
        'seller_price' => 'float',
        'buyer_price' => 'float',
        'markup_value' => 'float',
        'unlimited_stock' => 'boolean',
        'stock' => 'integer',
        'multi' => 'boolean',
        'is_active' => 'boolean',
        'synced_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByBrand($query, string $brand)
    {
        return $query->where('brand', $brand);
    }

    public function scopeTopUp($query)
    {
        return $query->where('type', 'topup');
    }

    public function scopeBill($query)
    {
        return $query->where('type', 'bill');
    }
}
