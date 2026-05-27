<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseOrderRequest;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderDetail;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('manage-purchases');

        $search = $request->get('search');
        $status = $request->get('status');
        $sortField = $request->get('sort_field', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');

        $query = PurchaseOrder::with(['supplier', 'user', 'details.product'])
            ->when($search, fn ($q, $s) => $q->where('po_number', 'like', "%{$s}%")
                ->orWhereHas('supplier', fn ($sq) => $sq->where('name', 'like', "%{$s}%")))
            ->when($status, fn ($q, $s) => $q->where('status', $s));

        $allowedSort = ['po_number', 'total_amount', 'status', 'order_date', 'created_at'];
        if (! in_array($sortField, $allowedSort)) {
            $sortField = 'created_at';
        }
        $sortDir = in_array(strtolower($sortDir), ['asc', 'desc']) ? strtolower($sortDir) : 'desc';

        $purchaseOrders = $query->orderBy($sortField, $sortDir)->paginate(10)->withQueryString();

        return Inertia::render('purchases/index', [
            'purchaseOrders' => $purchaseOrders,
            'filters' => ['search' => $search, 'status' => $status, 'sort_field' => $sortField, 'sort_dir' => $sortDir],
            'suppliers' => Supplier::select('id', 'name')->where('is_active', true)->get(),
            'products' => Product::select('id', 'name', 'sku', 'stock')->get(),
        ]);
    }

    public function store(StorePurchaseOrderRequest $request)
    {
        Gate::authorize('manage-purchases');

        $validated = $request->validated();
        $user = Auth::user();

        DB::transaction(function () use ($validated, $user) {
            $poNumber = 'PO-'.strtoupper(Str::random(8));

            $totalAmount = 0;
            $items = [];
            foreach ($validated['items'] as $item) {
                $subtotal = $item['quantity'] * $item['unit_cost'];
                $totalAmount += $subtotal;
                $items[] = new PurchaseOrderDetail([
                    'tenant_id' => tenant_id(),
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'received_quantity' => 0,
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $subtotal,
                ]);
            }

            $purchaseOrder = PurchaseOrder::create([
                'tenant_id' => tenant_id(),
                'po_number' => $poNumber,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'user_id' => $user->id,
                'order_date' => $validated['order_date'],
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);

            $purchaseOrder->details()->saveMany($items);
        });

        return Redirect::back()->with('success', 'Purchase order created successfully.');
    }

    public function receive(PurchaseOrder $purchaseOrder)
    {
        Gate::authorize('manage-purchases');

        if ($purchaseOrder->status !== 'pending') {
            return Redirect::back()->with('error', 'Purchase order is not pending.');
        }

        $user = Auth::user();

        DB::transaction(function () use ($purchaseOrder, $user) {
            $purchaseOrder->load('details.product');
            foreach ($purchaseOrder->details as $detail) {
                $product = Product::lockForUpdate()->findOrFail($detail->product_id);
                $stockBefore = $product->stock;

                $detail->update([
                    'received_quantity' => $detail->quantity,
                ]);

                $product->increment('stock', $detail->quantity);

                if ($detail->unit_cost > 0) {
                    $product->update(['cost_price' => $detail->unit_cost]);
                }

                StockMovement::create([
                    'tenant_id' => tenant_id(),
                    'product_id' => $detail->product_id,
                    'user_id' => $user->id,
                    'type' => 'in',
                    'quantity' => $detail->quantity,
                    'stock_before' => $stockBefore,
                    'stock_after' => $product->fresh()->stock,
                    'reference_type' => PurchaseOrder::class,
                    'reference_id' => $purchaseOrder->id,
                    'reason' => 'purchase_receive',
                    'notes' => "PO: {$purchaseOrder->po_number}",
                ]);
            }

            $purchaseOrder->update([
                'status' => 'received',
                'received_date' => now(),
            ]);
        });

        return Redirect::back()->with('success', 'Purchase order received successfully.');
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        Gate::authorize('manage-purchases');

        if ($purchaseOrder->status === 'received') {
            return Redirect::back()->with('error', 'Cannot delete received purchase order.');
        }

        $purchaseOrder->delete();

        return Redirect::back()->with('success', 'Purchase order deleted successfully.');
    }
}
