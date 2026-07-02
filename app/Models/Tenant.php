<?php

namespace App\Models;

use App\Services\SubscriptionService;
use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::deleting(function ($tenant) {
            if ($tenant->logo) {
                Storage::disk('public')->delete($tenant->logo);
            }
        });
    }

    protected $fillable = [
        'id',
        'slug',
        'name',
        'address',
        'phone',
        'logo',
        'color_theme',
        'subscription_status',
        'subscription_tier',
        'subscription_expires_at',
        'settings',
        'city',
        'province',
        'shipping_cost',
        'store_description',
        'store_banner',
        'rajaongkir_city_id',
    ];

    protected function casts(): array
    {
        return [
            'subscription_status' => 'string',
            'subscription_tier' => 'string',
            'subscription_expires_at' => 'datetime',
            'settings' => 'array',
            'shipping_cost' => 'float',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function productsOnline()
    {
        return $this->products()->where('visible_online', true);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function tenantUsers(): HasMany
    {
        return $this->hasMany(TenantUser::class);
    }

    public function staffUsers(): HasMany
    {
        return $this->tenantUsers()->where('is_active', true);
    }

    public function customers(): BelongsToMany
    {
        return $this->belongsToMany(Customer::class, 'store_customer')
            ->withPivot(['loyalty_points', 'total_spent', 'last_visit_at', 'notes'])
            ->withTimestamps();
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function isPremium(): bool
    {
        return app(SubscriptionService::class)->isPremium($this);
    }

    public function maxProducts(): int
    {
        return app(SubscriptionService::class)->maxProducts($this);
    }

    public function maxStaff(): int
    {
        return app(SubscriptionService::class)->maxStaff($this);
    }

    public function canExport(): bool
    {
        return app(SubscriptionService::class)->canExport($this);
    }

    public function canMarketplace(): bool
    {
        return app(SubscriptionService::class)->canMarketplace($this);
    }

    public function getPointConfig(): array
    {
        return [
            'points_per_currency' => (int) ($this->settings['points_per_currency'] ?? 10000),
            'point_value' => (int) ($this->settings['point_value'] ?? 100),
            'min_redeem_points' => (int) ($this->settings['min_redeem_points'] ?? 100),
        ];
    }
}
