<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceCategory;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MarketplaceController extends Controller
{
    public function landing(Request $request)
    {
        $stores = Tenant::where('subscription_status', 'active')
            ->whereHas('products', fn ($q) => $q->visibleOnline())
            ->withCount(['products' => fn ($q) => $q->visibleOnline()])
            ->latest()
            ->take(8)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'slug' => $t->slug,
                'name' => $t->name,
                'city' => $t->city,
                'logo_url' => $t->logo ? url('storage/'.$t->logo) : null,
                'store_description' => $t->store_description,
                'products_count' => $t->products_count,
            ]);

        $featuredProducts = Product::visibleOnline()
            ->with(['tenant:id,slug,name,logo,city', 'category:id,name'])
            ->latest()
            ->take(12)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug ?? $p->id,
                'display_price' => $p->display_price,
                'price' => $p->price,
                'online_price' => $p->online_price,
                'image_url' => $p->image_url,
                'stock' => $p->available_stock,
                'tenant' => [
                    'slug' => $p->tenant->slug,
                    'name' => $p->tenant->name,
                ],
                'category' => $p->category?->name,
            ]);

        return Inertia::render('marketplace/landing', [
            'stores' => $stores,
            'featuredProducts' => $featuredProducts,
            'filters' => ['search' => $request->get('search')],
        ]);
    }

    public function stores(Request $request)
    {
        $search = $request->get('search');

        $stores = Tenant::where('subscription_status', 'active')
            ->whereHas('products', fn ($q) => $q->visibleOnline())
            ->withCount(['products' => fn ($q) => $q->visibleOnline()])
            ->when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn ($t) => [
                'id' => $t->id,
                'slug' => $t->slug,
                'name' => $t->name,
                'city' => $t->city,
                'province' => $t->province,
                'logo_url' => $t->logo ? url('storage/'.$t->logo) : null,
                'store_description' => $t->store_description,
                'products_count' => $t->products_count,
            ]);

        return Inertia::render('marketplace/stores', [
            'stores' => $stores,
            'filters' => ['search' => $search],
        ]);
    }

    private function categoryFilterCallback(?string $categorySlug): ?callable
    {
        if (! $categorySlug) {
            return null;
        }

        $cat = MarketplaceCategory::with('keywords', 'children.keywords')
            ->where('slug', $categorySlug)
            ->first();

        if (! $cat) {
            return null;
        }

        $marketplaceIds = $cat->allChildrenIds();
        $activeKeywords = $cat->allKeywords();

        return fn ($q) => $q->whereHas('category', fn ($cq) => $cq->where(function ($sub) use ($marketplaceIds, $activeKeywords) {
            $sub->whereIn('marketplace_category_id', $marketplaceIds);

            if (! empty($activeKeywords)) {
                $sub->orWhereIn(DB::raw('LOWER(TRIM(name))'), array_map('strtolower', $activeKeywords));
            }
        }));
    }

    public function store(Request $request, string $slug)
    {
        $tenant = Tenant::where('slug', $slug)
            ->where('subscription_status', 'active')
            ->firstOrFail();

        $search = $request->get('search');
        $categorySlug = $request->get('category');

        $products = Product::visibleOnline()
            ->where('tenant_id', $tenant->id)
            ->with(['category:id,name', 'variants'])
            ->when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($categorySlug, $this->categoryFilterCallback($categorySlug))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'description' => $p->description,
                'display_price' => $p->display_price,
                'price' => $p->price,
                'online_price' => $p->online_price,
                'image_url' => $p->image_url,
                'stock' => $p->available_stock,
                'category' => $p->category?->name,
                'has_variants' => $p->variants->isNotEmpty(),
                'variants' => $p->variants->map(fn ($v) => [
                    'id' => $v->id,
                    'name' => $v->name,
                    'additional_price' => $v->additional_price,
                    'stock' => $v->stock,
                ]),
            ]);

        $categories = MarketplaceCategory::with(['children' => fn ($q) => $q->orderBy('sort_order')])
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['name', 'slug']);

        return Inertia::render('marketplace/store', [
            'store' => [
                'id' => $tenant->id,
                'slug' => $tenant->slug,
                'name' => $tenant->name,
                'description' => $tenant->store_description,
                'address' => $tenant->address,
                'city' => $tenant->city,
                'province' => $tenant->province,
                'phone' => $tenant->phone,
                'logo_url' => $tenant->logo ? url('storage/'.$tenant->logo) : null,
                'banner_url' => $tenant->store_banner ? url('storage/'.$tenant->store_banner) : null,
                'shipping_cost' => $tenant->shipping_cost,
            ],
            'products' => $products,
            'categories' => $categories,
            'filters' => ['search' => $search, 'category' => $categorySlug],
        ]);
    }

    public function allProducts(Request $request)
    {
        $search = $request->get('search');
        $categorySlug = $request->get('category');
        $sort = $request->get('sort', 'latest');
        $priceMin = $request->get('price_min');
        $priceMax = $request->get('price_max');
        $location = $request->get('location');

        $products = Product::visibleOnline()
            ->with(['tenant:id,slug,name,logo,city', 'category:id,name'])
            ->when($search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($categorySlug, $this->categoryFilterCallback($categorySlug))
            ->when($sort === 'price_low', fn ($q) => $q->orderBy('display_price'))
            ->when($sort === 'price_high', fn ($q) => $q->orderByDesc('display_price'))
            ->when(in_array($sort, ['latest', 'newest']), fn ($q) => $q->latest())
            ->when($priceMin, fn ($q, $v) => $q->where('display_price', '>=', $v))
            ->when($priceMax, fn ($q, $v) => $q->where('display_price', '<=', $v))
            ->when($location, fn ($q, $loc) => $q->whereHas('tenant', fn ($tq) => $tq->where(DB::raw('LOWER(TRIM(city))'), strtolower($loc))))
            ->paginate(24)
            ->withQueryString()
            ->through(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug ?? (string) $p->id,
                'display_price' => $p->display_price,
                'price' => $p->price,
                'online_price' => $p->online_price,
                'image_url' => $p->image_url,
                'stock' => $p->available_stock,
                'category' => $p->category?->name,
                'tenant' => [
                    'slug' => $p->tenant->slug,
                    'name' => $p->tenant->name,
                    'city' => $p->tenant->city,
                ],
            ]);

        $categoryTree = MarketplaceCategory::with(['children' => fn ($q) => $q->orderBy('sort_order'), 'children.keywords'])
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
                ]),
            ]);

        $totalProducts = Product::visibleOnline()->count();

        return Inertia::render('marketplace/products', [
            'products' => $products,
            'categories' => $categoryTree,
            'totalProducts' => $totalProducts,
            'filters' => [
                'search' => $search,
                'category' => $categorySlug,
                'sort' => $sort,
                'price_min' => $priceMin,
                'price_max' => $priceMax,
                'location' => $location,
            ],
        ]);
    }

    public function product(string $slug, string $productSlug)
    {
        $tenant = Tenant::where('slug', $slug)
            ->where('subscription_status', 'active')
            ->firstOrFail();

        $product = Product::visibleOnline()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $productSlug)
            ->with(['category:id,name', 'variants', 'extras', 'tenant:id,slug,name,logo,city,phone,shipping_cost'])
            ->firstOrFail();

        $salesCount = OrderItem::where('product_id', $product->id)
            ->whereHas('order', fn ($q) => $q->where('status', 'completed'))
            ->sum('quantity');

        $reviewDistribution = Review::where('tenant_id', $tenant->id)
            ->selectRaw('rating, count(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating');

        $recentReviews = Review::where('tenant_id', $tenant->id)
            ->with('user:id,name')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'review' => $r->review,
                'user_name' => $r->user?->name ?? 'Anonim',
                'date' => $r->created_at->diffForHumans(),
            ]);

        return Inertia::render('marketplace/product', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->description,
                'display_price' => $product->display_price,
                'price' => $product->price,
                'online_price' => $product->online_price,
                'image_url' => $product->image_url,
                'stock' => $product->available_stock,
                'weight' => $product->weight,
                'condition' => 'Baru',
                'min_buy' => 1,
                'sales_count' => $salesCount,
                'category' => $product->category?->name,
                'variants' => $product->variants->map(fn ($v) => [
                    'id' => $v->id,
                    'name' => $v->name,
                    'additional_price' => $v->additional_price,
                    'stock' => $v->stock,
                ]),
                'extras' => $product->extras->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'additional_price' => $e->additional_price,
                ]),
                'store' => [
                    'slug' => $product->tenant->slug,
                    'name' => $product->tenant->name,
                    'logo_url' => $product->tenant->logo ? url('storage/'.$product->tenant->logo) : null,
                    'city' => $product->tenant->city,
                    'phone' => $product->tenant->phone,
                    'shipping_cost' => $product->tenant->shipping_cost,
                ],
                'reviews' => [
                    'average' => round(Review::where('tenant_id', $tenant->id)->avg('rating') ?? 0, 1),
                    'total' => Review::where('tenant_id', $tenant->id)->count(),
                    'distribution' => [
                        (int) ($reviewDistribution->get(5, 0)),
                        (int) ($reviewDistribution->get(4, 0)),
                        (int) ($reviewDistribution->get(3, 0)),
                        (int) ($reviewDistribution->get(2, 0)),
                        (int) ($reviewDistribution->get(1, 0)),
                    ],
                    'recent' => $recentReviews,
                ],
            ],
        ]);
    }
}
