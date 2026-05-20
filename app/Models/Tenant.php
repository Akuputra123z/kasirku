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
    ];

    protected function casts(): array
    {
        return [
            'subscription_status' => 'string',
        ];
    }
}
