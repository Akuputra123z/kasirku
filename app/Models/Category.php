<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Category extends Model
{
    use HasFactory, HasTenant, LogsActivity, SoftDeletes;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    protected $fillable = ['tenant_id', 'name', 'description', 'marketplace_category_id'];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function marketplaceCategory(): BelongsTo
    {
        return $this->belongsTo(MarketplaceCategory::class);
    }
}
