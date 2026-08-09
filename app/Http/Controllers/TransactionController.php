<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shift;
use App\Models\StockMovement;
use App\Models\StoreCustomer;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Voucher;
use App\Services\BarcodeService;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('manage-pos');

        $customers = Customer::whereHas('stores', fn ($q) => $q->where('tenant_id', tenant_id()))
            ->with(['storeCustomer' => fn ($q) => $q->where('tenant_id', tenant_id())])
            ->select('id', 'name', 'phone', 'email')
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'email' => $c->email,
                'loyalty_points' => $c->storeCustomer?->first()?->loyalty_points ?? 0,
            ]);

        return Inertia::render('transactions/index', [
            'products' => Product::with(['category', 'variants'])
                ->where('status', 'active')
                ->get(),
            'paymentMethods' => PaymentMethod::where('is_active', true)->get(),
            'customers' => $customers,
            'activeShift' => Shift::where('user_id', auth()->id())
                ->whereNull('end_time')
                ->first(),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-pos');

        $activeShift = Shift::where('user_id', auth()->id())
            ->whereNull('end_time')
            ->first();

        if (! $activeShift) {
            return Redirect::back()->withErrors(['error' => 'Sesi Kasir (Shift) belum dibuka! Silakan buka shift terlebih dahulu.']);
        }

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'tax_amount' => 'required|numeric|min:0',
            'discount_amount' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'order_type' => 'required|in:direct,service,pre_order',
            'table_number' => 'nullable|string|max:10',
            'customer_id' => 'nullable|exists:customers,id',
            'voucher_id' => 'nullable|exists:vouchers,id',
            'redeemed_points' => 'nullable|integer|min:0',
        ]);

        $transaction = null;

        try {
            DB::transaction(function () use ($request, $activeShift, &$transaction) {
                // ── Harga selalu dihitung ulang dari katalog (server-side).
                // items.*.price dari client TIDAK PERNAH dipercaya.
                $itemsWithPrices = [];
                $calculatedSubtotal = 0.0;

                foreach ($request->items as $item) {
                    $product = Product::lockForUpdate()->findOrFail($item['product_id']);

                    $variant = null;
                    if (! empty($item['product_variant_id'])) {
                        $variant = ProductVariant::lockForUpdate()->findOrFail($item['product_variant_id']);

                        if ($variant->product_id !== $product->id) {
                            throw new \Exception("Varian {$variant->name} bukan milik produk {$product->name}.");
                        }
                    }

                    $pricePerUnit = round((float) $product->price + (float) ($variant?->additional_price ?? 0), 2);

                    $itemsWithPrices[] = [
                        ...$item,
                        'product' => $product,
                        'variant' => $variant,
                        'price' => $pricePerUnit,
                    ];

                    $calculatedSubtotal = round(
                        $calculatedSubtotal + $pricePerUnit * (int) $item['quantity'],
                        2,
                    );
                }

                $taxAmount = round((float) $request->tax_amount, 2);
                $manualDiscount = round((float) $request->discount_amount, 2);

                // Diskon voucher dihitung ulang server-side (cap max_discount
                // dan jenis voucher diterapkan di sini, bukan dari client).
                $voucherDiscount = 0.0;
                $voucher = null;

                if ($request->voucher_id) {
                    $voucher = Voucher::lockForUpdate()->findOrFail($request->voucher_id);

                    if ((int) $voucher->tenant_id !== (int) tenant_id()) {
                        throw new \Exception('Voucher tidak ditemukan di toko ini.');
                    }

                    $eligibleAmount = $calculatedSubtotal + $taxAmount - $manualDiscount;

                    if (! $voucher->isValid($eligibleAmount)) {
                        throw new \Exception('Voucher sudah tidak berlaku.');
                    }

                    $voucherDiscount = $voucher->calculateDiscount($eligibleAmount);
                }

                // Diskon poin dihitung dari konfigurasi tenant, bukan input client.
                $pointConfig = PointService::getConfig();
                $pointDiscount = 0.0;

                if ((int) ($request->redeemed_points ?? 0) > 0) {
                    if (! $request->customer_id) {
                        throw new \Exception('Pelanggan wajib dipilih untuk penukaran poin.');
                    }

                    if ((int) $request->redeemed_points < (int) ($pointConfig['min_redeem_points'] ?? 0)) {
                        throw new \Exception('Poin penukaran belum mencapai batas minimum.');
                    }

                    $storeCustomer = StoreCustomer::lockForUpdate()
                        ->where('customer_id', $request->customer_id)
                        ->where('tenant_id', tenant_id())
                        ->first();

                    if (! $storeCustomer || $storeCustomer->loyalty_points < (int) $request->redeemed_points) {
                        throw new \Exception('Poin pelanggan tidak mencukupi.');
                    }

                    $pointDiscount = round(
                        (int) $request->redeemed_points * (float) ($pointConfig['point_value'] ?? 0),
                        2,
                    );
                }

                // Pelanggan wajib terdaftar di toko ini (anti cross-tenant).
                if ($request->customer_id) {
                    $customerBelongsToStore = StoreCustomer::where('customer_id', $request->customer_id)
                        ->where('tenant_id', tenant_id())
                        ->exists();

                    if (! $customerBelongsToStore) {
                        throw new \Exception('Pelanggan tidak terdaftar di toko ini.');
                    }
                }

                $calculatedTotal = round(
                    $calculatedSubtotal + $taxAmount - $manualDiscount - $voucherDiscount - $pointDiscount,
                    2,
                );

                if ($calculatedTotal < 0) {
                    throw new \Exception('Total diskon melebihi total belanja.');
                }

                $paidAmount = round((float) $request->paid_amount, 2);

                if (round($paidAmount, 2) < round($calculatedTotal, 2)) {
                    throw new \Exception('Uang pembayaran tidak mencukupi.');
                }

                $transactionCode = 'TRX-'.now()->format('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));

                $transaction = Transaction::create([
                    'tenant_id' => tenant_id(),
                    'transaction_code' => $transactionCode,
                    'subtotal_amount' => $calculatedSubtotal,
                    'tax_amount' => $taxAmount,
                    'discount_amount' => $manualDiscount + $voucherDiscount + $pointDiscount,
                    'total_amount' => $calculatedTotal,
                    'paid_amount' => $paidAmount,
                    'change_amount' => round($paidAmount - $calculatedTotal, 2),
                    'payment_method_id' => $request->payment_method_id,
                    'shift_id' => $activeShift->id,
                    'user_id' => auth()->id(),
                    'order_type' => $request->order_type,
                    'table_number' => $request->table_number,
                    'status' => 'completed',
                    'customer_id' => $request->customer_id,
                    'voucher_id' => $request->voucher_id,
                    'redeemed_points' => (int) ($request->redeemed_points ?? 0),
                ]);

                foreach ($itemsWithPrices as $item) {
                    $product = $item['product'];
                    $variant = $item['variant'];

                    if ($product->stock < $item['quantity']) {
                        throw new \Exception("Stok {$product->name} tidak cukup (Sisa: {$product->stock})");
                    }

                    $stockBefore = $product->stock;

                    if ($variant) {
                        if ($variant->stock < $item['quantity']) {
                            throw new \Exception("Stok varian {$variant->name} tidak cukup (Sisa: {$variant->stock})");
                        }
                        $variant->decrement('stock', (int) $item['quantity']);
                    }

                    TransactionDetail::create([
                        'transaction_id' => $transaction->id,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'variant_name' => $variant?->name ?? $item['variant_name'] ?? null,
                        'extras_selected' => isset($item['extras']) ? json_encode($item['extras']) : null,
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'subtotal' => $item['price'] * $item['quantity'],
                        'notes' => $item['notes'] ?? null,
                    ]);

                    $product->decrement('stock', $item['quantity']);

                    BarcodeService::bustForProductId($product->id);

                    StockMovement::create([
                        'tenant_id' => tenant_id(),
                        'product_id' => $product->id,
                        'product_variant_id' => $variant?->id,
                        'user_id' => auth()->id(),
                        'type' => 'out',
                        'quantity' => $item['quantity'],
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockBefore - $item['quantity'],
                        'reference_type' => Transaction::class,
                        'reference_id' => $transaction->id,
                        'reason' => 'pos_sale',
                        'notes' => "TRX: {$transaction->transaction_code}",
                    ]);
                }

                if ($voucher) {
                    $voucher->increment('used_count');

                    if ($request->customer_id) {
                        $customer = Customer::findOrFail($request->customer_id);
                        $customer->vouchers()->attach($voucher->id, [
                            'tenant_id' => tenant_id(),
                            'redeemed_at' => now(),
                        ]);
                    }
                }

                if ((int) ($request->redeemed_points ?? 0) > 0 && $request->customer_id) {
                    PointService::redeemPoints(
                        $request->customer_id,
                        $transaction,
                        (int) $request->redeemed_points
                    );
                }

                if ($request->customer_id) {
                    PointService::earnPoints(
                        $request->customer_id,
                        $transaction,
                        (int) $calculatedTotal
                    );
                }
            });

            return Redirect::back()->with([
                'success' => 'Transaksi berhasil diselesaikan.',
                'transaction' => [
                    'id' => $transaction->id,
                    'transaction_code' => $transaction->transaction_code,
                    'total_amount' => $transaction->total_amount,
                    'paid_amount' => $transaction->paid_amount,
                    'change_amount' => $transaction->change_amount,
                    'subtotal_amount' => $transaction->subtotal_amount,
                    'tax_amount' => $transaction->tax_amount,
                    'discount_amount' => $transaction->discount_amount,
                    'order_type' => $transaction->order_type,
                    'created_at' => $transaction->created_at,
                ],
            ]);

        } catch (\Exception $e) {
            return Redirect::back()->withErrors(['error' => 'Gagal Checkout: '.$e->getMessage()]);
        }
    }

    public function history(): Response
    {
        Gate::authorize('view-history');

        $transactions = Transaction::with(['details.product', 'user', 'paymentMethod', 'customer', 'voucher'])
            ->withCount('pointTransactions')
            ->latest()
            ->paginate(15);

        $summary = [
            'total_revenue' => Transaction::sum('total_amount'),
            'total_transactions' => Transaction::count(),
            'avg_transaction' => round(Transaction::avg('total_amount') ?? 0),
        ];

        return Inertia::render('transactions/history', [
            'transactions' => $transactions,
            'summary' => $summary,
        ]);
    }
}
