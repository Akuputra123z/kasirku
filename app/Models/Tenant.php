<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'subscription_status' => 'string',
            'settings' => 'array',
        ];
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
