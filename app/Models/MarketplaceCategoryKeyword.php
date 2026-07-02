<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketplaceCategoryKeyword extends Model
{
    protected $fillable = ['marketplace_category_id', 'keyword'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(MarketplaceCategory::class, 'marketplace_category_id');
    }
}
