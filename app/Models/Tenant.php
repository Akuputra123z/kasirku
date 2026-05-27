<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

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
