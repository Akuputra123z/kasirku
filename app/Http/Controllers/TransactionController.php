<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Voucher;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    /**
     * Menampilkan halaman kasir dengan data produk dan metode pembayaran yang aktif.
     */
    public function index(): Response
    {
        return Inertia::render('transactions/index', [
            'products' => Product::with(['category', 'variants'])
                ->where('status', 'active')
                ->get(),
            'paymentMethods' => PaymentMethod::where('is_active', true)->get(),
            'customers' => Customer::select('id', 'name', 'phone', 'email', 'loyalty_points')
                ->orderBy('name')
                ->get(),
            'activeShift' => Shift::where('user_id', auth()->id())
                ->whereNull('end_time')
                ->first(),
        ]);
    }

    /**
     * Menyimpan transaksi baru dengan validasi stok dan sinkronisasi shift.
     */
    /**
     * Menyimpan transaksi baru dengan validasi stok dan sinkronisasi shift.
     */
    public function store(Request $request)
    {
        // 1. Validasi Keberadaan Shift
        $activeShift = Shift::where('user_id', auth()->id())
            ->whereNull('end_time')
            ->first();

        if (! $activeShift) {
            return Redirect::back()->withErrors(['error' => 'Sesi Kasir (Shift) belum dibuka! Silakan buka shift terlebih dahulu.']);
        }

        // 2. Validasi Input Transaksi (Dibuat lebih fleksibel agar tidak gampang error)
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'subtotal_amount' => 'required|numeric',
            'tax_amount' => 'required|numeric',
            'discount_amount' => 'required|numeric',
            'total_amount' => 'required|numeric',
            'paid_amount' => 'required|numeric',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'order_type' => 'required|in:direct,service,pre_order',
            'table_number' => 'nullable|string|max:10',
            'customer_id' => 'nullable|exists:customers,id',
            'voucher_id' => 'nullable|exists:vouchers,id',
            'redeemed_points' => 'nullable|integer|min:0',
        ]);

        if ($request->paid_amount < $request->total_amount) {
            return Redirect::back()->withErrors(['error' => 'Uang pembayaran tidak mencukupi.']);
        }

        // Validasi poin jika ada penukaran
        if ($request->redeemed_points && $request->customer_id) {
            $customer = Customer::findOrFail($request->customer_id);
            if ($customer->loyalty_points < $request->redeemed_points) {
                return Redirect::back()->withErrors(['error' => 'Poin pelanggan tidak mencukupi.']);
            }
        }

        // Validasi voucher jika ada
        if ($request->voucher_id) {
            $voucher = Voucher::findOrFail($request->voucher_id);
            if (! $voucher->isValid((int) $request->total_amount)) {
                return Redirect::back()->withErrors(['error' => 'Voucher sudah tidak berlaku.']);
            }
        }

        try {
            DB::transaction(function () use ($request, $activeShift) {
                // 3. Generate Kode Transaksi Unik
                $transactionCode = 'TRX-'.now()->format('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));

                // 4. Simpan Header Transaksi
                $transaction = Transaction::create([
                    'transaction_code' => $transactionCode,
                    'subtotal_amount' => $request->subtotal_amount,
                    'tax_amount' => $request->tax_amount,
                    'discount_amount' => $request->discount_amount,
                    'total_amount' => $request->total_amount,
                    'paid_amount' => $request->paid_amount,
                    'change_amount' => $request->paid_amount - $request->total_amount,
                    'payment_method_id' => $request->payment_method_id,
                    'shift_id' => $activeShift->id,
                    'user_id' => auth()->id(),
                    'order_type' => $request->order_type,
                    'table_number' => $request->table_number,
                    'status' => 'completed',
                    'customer_id' => $request->customer_id,
                    'voucher_id' => $request->voucher_id,
                    'redeemed_points' => $request->redeemed_points ?? 0,
                ]);

                // 5. Simpan Detail Transaksi & Update Stok
                foreach ($request->items as $item) {
                    $product = Product::lockForUpdate()->findOrFail($item['product_id']);

                    // Cek stok sebelum potong
                    if ($product->stock < $item['quantity']) {
                        throw new \Exception("Stok {$product->name} tidak cukup (Sisa: {$product->stock})");
                    }

                    TransactionDetail::create([
                        'transaction_id' => $transaction->id,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'variant_name' => $item['variant_name'] ?? null,
                        'extras_selected' => isset($item['extras']) ? json_encode($item['extras']) : null,
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'subtotal' => $item['price'] * $item['quantity'],
                        'notes' => $item['notes'] ?? null,
                    ]);

                    $product->decrement('stock', $item['quantity']);
                }

                if ($request->voucher_id) {
                    $voucher = Voucher::findOrFail($request->voucher_id);
                    $voucher->increment('used_count');

                    if ($request->customer_id) {
                        $customer = Customer::findOrFail($request->customer_id);
                        $customer->vouchers()->attach($voucher->id, [
                            'transaction_id' => $transaction->id,
                            'used_at' => now(),
                        ]);
                    }
                }

                if ($request->redeemed_points && $request->customer_id) {
                    $customer = Customer::findOrFail($request->customer_id);
                    PointService::redeemPoints($customer, $transaction, (int) $request->redeemed_points);
                }

                if ($request->customer_id) {
                    $customer = Customer::findOrFail($request->customer_id);
                    PointService::earnPoints($customer, $transaction, (int) $request->total_amount);
                }
            });

            return Redirect::back()->with('success', 'Transaksi berhasil diselesaikan.');

        } catch (\Exception $e) {
            // Mengembalikan pesan error yang jelas ke Inertia
            return Redirect::back()->withErrors(['error' => 'Gagal Checkout: '.$e->getMessage()]);
        }
    }

    /**
     * Menampilkan riwayat transaksi dengan ringkasan otomatis.
     */
    public function history(): Response
    {
        // Menggunakan Pagination untuk efisiensi beban kerja MacBook Air Anda
        $transactions = Transaction::with(['details.product', 'user', 'paymentMethod', 'customer', 'voucher'])
            ->withCount('pointTransactions')
            ->latest()
            ->paginate(15);

        // Summary cepat untuk tampilan dashboard/history
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
