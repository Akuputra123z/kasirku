<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockMovementRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('manage-stock');

        $search = $request->get('search');
        $type = $request->get('type');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $sortField = $request->get('sort_field', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');

        $query = StockMovement::with(['product', 'productVariant', 'user']);

        if ($search) {
            $query->whereHas('product', fn ($pq) => $pq->where('name', 'like', "%{$search}%"));
        }

        if ($type) {
            $query->where('type', $type);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $allowedSort = ['created_at', 'quantity', 'type', 'stock_before', 'stock_after'];
        if (! in_array($sortField, $allowedSort)) {
            $sortField = 'created_at';
        }
        $sortDir = in_array(strtolower($sortDir), ['asc', 'desc']) ? strtolower($sortDir) : 'desc';

        $movements = $query->orderBy($sortField, $sortDir)->paginate(15)->withQueryString();

        $todayStats = StockMovement::whereDate('created_at', today())
            ->selectRaw("
                SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) as stock_in,
                SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as stock_out,
                COUNT(*) as total_movements
            ")
            ->first();

        return Inertia::render('stock-movements/index', [
            'movements' => $movements,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'sort_field' => $sortField,
                'sort_dir' => $sortDir,
            ],
            'todayStats' => [
                'stock_in' => (int) ($todayStats->stock_in ?? 0),
                'stock_out' => (int) ($todayStats->stock_out ?? 0),
                'total_movements' => (int) ($todayStats->total_movements ?? 0),
            ],
            'products' => Product::with('variants:id,product_id,name,sku,stock')
                ->select('id', 'name', 'sku', 'stock')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StoreStockMovementRequest $request)
    {
        Gate::authorize('manage-stock');

        $validated = $request->validated();
        $user = Auth::user();

        DB::transaction(function () use ($validated, $user) {
            $product = Product::lockForUpdate()->findOrFail($validated['product_id']);
            $quantity = (int) $validated['quantity'];

            if ($variantId = $validated['product_variant_id'] ?? null) {
                $variant = ProductVariant::lockForUpdate()->findOrFail($variantId);
                $variantBefore = $variant->stock;

                $variantAfter = match ($validated['type']) {
                    'in' => $variantBefore + $quantity,
                    'out' => $variantBefore - $quantity,
                    default => $variantBefore + $quantity,
                };

                if ($variantAfter < 0) {
                    abort(422, 'Insufficient variant stock.');
                }

                $variant->update(['stock' => $variantAfter]);

                StockMovement::create([
                    'tenant_id' => tenant_id(),
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'user_id' => $user->id,
                    'type' => $validated['type'],
                    'quantity' => $quantity,
                    'stock_before' => $variantBefore,
                    'stock_after' => $variantAfter,
                    'reason' => $validated['reason'],
                    'notes' => $validated['notes'] ?? null,
                ]);
            } else {
                $stockBefore = $product->stock;

                $stockAfter = match ($validated['type']) {
                    'in' => $stockBefore + $quantity,
                    'out' => $stockBefore - $quantity,
                    default => $stockBefore + $quantity,
                };

                if ($stockAfter < 0) {
                    abort(422, 'Insufficient stock.');
                }

                $product->update(['stock' => $stockAfter]);

                StockMovement::create([
                    'tenant_id' => tenant_id(),
                    'product_id' => $product->id,
                    'user_id' => $user->id,
                    'type' => $validated['type'],
                    'quantity' => $quantity,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'reason' => $validated['reason'],
                    'notes' => $validated['notes'] ?? null,
                ]);
            }
        });

        return Redirect::back()->with('success', 'Stock movement recorded successfully.');
    }
}
