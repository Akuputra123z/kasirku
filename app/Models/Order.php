<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $fillable = [
        'type',
        'order_number',
        'user_id',
        'tenant_id',
        'status',
        'subtotal',
        'shipping_cost',
        'total',
        'payment_status',
        'payment_method',
        'shipping_address',
        'recipient_name',
        'recipient_phone',
        'customer_phone',
        'notes',
        'midtrans_transaction_id',
        'midtrans_order_id',
        'midtrans_redirect_url',
        'digiflazz_ref_id',
        'digiflazz_status',
        'digiflazz_message',
        'digiflazz_sn',
        'ppob_category',
        'ppob_brand',
        'ppob_buyer_sku_code',
        'ppob_customer_name',
        'ppob_seller_price',
        'ppob_markup',
        'shipping_courier',
        'shipping_service',
        'tracking_number',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'shipping_cost' => 'float',
        'total' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function scopePpob($query)
    {
        return $query->where('type', 'ppob');
    }

    public function scopeMarketplace($query)
    {
        return $query->where('type', 'marketplace');
    }

    public function isPpob(): bool
    {
        return $this->type === 'ppob';
    }

    public function isPendingDigiflazz(): bool
    {
        return $this->type === 'ppob'
            && $this->payment_status === 'paid'
            && $this->digiflazz_status === null;
    }
}
