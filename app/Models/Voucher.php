<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Voucher extends Model
{
    use HasTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'code', 'name', 'type', 'value',
        'min_order_amount', 'max_discount',
        'max_uses', 'used_count',
        'valid_from', 'valid_until', 'is_active',
    ];

    protected $casts = [
        'value' => 'float',
        'min_order_amount' => 'float',
        'max_discount' => 'float',
        'used_count' => 'integer',
        'max_uses' => 'integer',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function isValid(float $orderAmount): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->valid_from && now()->lt($this->valid_from)) {
            return false;
        }

        if ($this->valid_until && now()->gt($this->valid_until)) {
            return false;
        }

        if ($this->max_uses && $this->used_count >= $this->max_uses) {
            return false;
        }

        if ($orderAmount < $this->min_order_amount) {
            return false;
        }

        return true;
    }

    public function calculateDiscount(float $orderAmount): float
    {
        $discount = $this->type === 'percentage'
            ? $orderAmount * $this->value / 100
            : $this->value;

        if ($this->max_discount && $discount > $this->max_discount) {
            $discount = $this->max_discount;
        }

        return round($discount, 2);
    }
}
