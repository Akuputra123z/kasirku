<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceCategory;
use Inertia\Inertia;

class MarketplaceCategoryController extends Controller
{
    public function index()
    {
        $categories = MarketplaceCategory::with(['children' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'), 'children.keywords'])
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($parent) => [
                'name' => $parent->name,
                'slug' => $parent->slug,
                'icon' => $parent->icon,
                'children' => $parent->children->map(fn ($child) => [
                    'name' => $child->name,
                    'slug' => $child->slug,
                    'keywords' => $child->keywords->pluck('keyword'),
                ]),
            ]);

        return Inertia::render('tenant/marketplace-categories', [
            'categories' => $categories,
        ]);
    }
}
