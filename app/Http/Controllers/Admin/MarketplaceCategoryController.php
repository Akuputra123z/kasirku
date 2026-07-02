<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceCategory;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MarketplaceCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = MarketplaceCategory::with(['children' => fn ($q) => $q->orderBy('sort_order'), 'children.keywords'])
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->paginate(10)
            ->withQueryString()
            ->through(fn ($parent) => [
                'id' => $parent->id,
                'name' => $parent->name,
                'slug' => $parent->slug,
                'icon' => $parent->icon,
                'sort_order' => $parent->sort_order,
                'is_active' => $parent->is_active,
                'product_count' => Product::visibleOnline()
                    ->whereHas('category', fn ($q) => $q->whereIn(DB::raw('LOWER(TRIM(name))'), array_map('strtolower', $parent->allKeywords())))
                    ->count(),
                'children' => $parent->children->map(fn ($child) => [
                    'id' => $child->id,
                    'name' => $child->name,
                    'slug' => $child->slug,
                    'sort_order' => $child->sort_order,
                    'keywords_count' => $child->keywords->count(),
                ]),
            ]);

        return Inertia::render('admin/marketplace-categories/index', [
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        $parents = MarketplaceCategory::whereNull('parent_id')->orderBy('sort_order')->get(['id', 'name']);

        return Inertia::render('admin/marketplace-categories/create', [
            'parents' => $parents,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'parent_id' => $request->input('parent_id') ?: null,
        ]);

        $data = $request->validate([
            'parent_id' => 'nullable|exists:marketplace_categories,id',
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:marketplace_categories,slug',
            'icon' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'keywords' => 'nullable|string',
        ]);

        $data['slug'] = $data['slug'] ?: Str::slug($data['name']);
        $data['sort_order'] ??= 0;

        $category = MarketplaceCategory::create($data);

        if (! empty($data['keywords'])) {
            $keywords = array_filter(array_map('trim', explode("\n", $data['keywords'])));
            foreach ($keywords as $keyword) {
                $category->keywords()->create(['keyword' => $keyword]);
            }
        }

        return redirect()->route('admin.marketplace-categories.index')
            ->with('success', 'Kategori berhasil dibuat.');
    }

    public function edit(int $id): Response
    {
        $category = MarketplaceCategory::with('keywords')->findOrFail($id);
        $parents = MarketplaceCategory::whereNull('parent_id')
            ->where('id', '!=', $id)
            ->orderBy('sort_order')
            ->get(['id', 'name']);

        return Inertia::render('admin/marketplace-categories/edit', [
            'category' => [
                'id' => $category->id,
                'parent_id' => $category->parent_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'icon' => $category->icon,
                'sort_order' => $category->sort_order,
                'is_active' => $category->is_active,
                'keywords' => $category->keywords->pluck('keyword')->join("\n"),
            ],
            'parents' => $parents,
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $request->merge([
            'parent_id' => $request->input('parent_id') ?: null,
        ]);

        $category = MarketplaceCategory::findOrFail($id);

        $data = $request->validate([
            'parent_id' => 'nullable|exists:marketplace_categories,id',
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:marketplace_categories,slug,'.$id,
            'icon' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'keywords' => 'nullable|string',
        ]);

        $data['slug'] = $data['slug'] ?: Str::slug($data['name']);
        $data['sort_order'] ??= 0;

        $category->update($data);

        $category->keywords()->delete();
        if (! empty($data['keywords'])) {
            $keywords = array_filter(array_map('trim', explode("\n", $data['keywords'])));
            foreach ($keywords as $keyword) {
                $category->keywords()->create(['keyword' => $keyword]);
            }
        }

        return redirect()->route('admin.marketplace-categories.index')
            ->with('success', 'Kategori berhasil diupdate.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $category = MarketplaceCategory::findOrFail($id);

        if ($category->children()->exists()) {
            return redirect()->route('admin.marketplace-categories.index')
                ->with('error', 'Hapus sub-kategori terlebih dahulu.');
        }

        $category->keywords()->delete();
        $category->delete();

        return redirect()->route('admin.marketplace-categories.index')
            ->with('success', 'Kategori berhasil dihapus.');
    }
}
