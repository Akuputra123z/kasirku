<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketplaceCategory extends Model
{
    protected $fillable = ['parent_id', 'name', 'slug', 'icon', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }

    public function keywords(): HasMany
    {
        return $this->hasMany(MarketplaceCategoryKeyword::class);
    }

    public function allKeywords(): array
    {
        $keywords = $this->keywords->pluck('keyword')->toArray();

        foreach ($this->children as $child) {
            $keywords = array_merge($keywords, $child->keywords->pluck('keyword')->toArray());
        }

        return $keywords;
    }

    public function allChildrenIds(): array
    {
        return [$this->id, ...$this->children->pluck('id')->toArray()];
    }
}
