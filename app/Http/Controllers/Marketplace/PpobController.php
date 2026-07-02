<?php

namespace App\Http\Controllers\Marketplace;

use App\Events\NewNotification;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PpobProduct;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Notifications\NewOrder;
use App\Services\DigiflazzService;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class PpobController extends Controller
{
    public function index()
    {
        $categories = PpobProduct::where('is_active', true)
            ->select('category', DB::raw('COUNT(*) as total'))
            ->groupBy('category')
            ->orderBy('category')
            ->get()
            ->map(fn ($c) => [
                'name' => $c->category,
                'slug' => strtolower(str_replace(' ', '-', $c->category)),
                'total' => $c->total,
                'icon' => $this->getCategoryIcon($c->category),
            ]);

        return Inertia::render('marketplace/ppob/index', [
            'categories' => $categories,
        ]);
    }

    public function products(Request $request, string $category)
    {
        $categoryName = str_replace('-', ' ', $category);
        $categoryName = ucwords($categoryName);

        $brand = $request->get('brand');
        $search = $request->get('search');

        $products = PpobProduct::active()
            ->byCategory($categoryName)
            ->when($brand, fn ($q, $b) => $q->byBrand($b))
            ->when($search, fn ($q, $s) => $q->where('product_name', 'like', "%{$s}%"))
            ->orderBy('brand')
            ->orderBy('buyer_price')
            ->paginate(24)
            ->withQueryString()
            ->through(fn ($p) => [
                'buyer_sku_code' => $p->buyer_sku_code,
                'product_name' => $p->product_name,
                'category' => $p->category,
                'brand' => $p->brand,
                'seller_price' => $p->seller_price,
                'buyer_price' => $p->buyer_price,
                'type' => $p->type,
                'unlimited_stock' => $p->unlimited_stock,
                'stock' => $p->stock,
                'description' => $p->description,
            ]);

        $brands = PpobProduct::active()
            ->byCategory($categoryName)
            ->select('brand')
            ->distinct()
            ->orderBy('brand')
            ->pluck('brand');

        $activeCategory = PpobProduct::active()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->get()
            ->map(fn ($c) => [
                'name' => $c->category,
                'slug' => strtolower(str_replace(' ', '-', $c->category)),
            ]);

        return Inertia::render('marketplace/ppob/products', [
            'products' => $products,
            'brands' => $brands,
            'activeCategory' => [
                'name' => $categoryName,
                'slug' => $category,
                'is_phone_category' => in_array(strtolower($categoryName), ['pulsa', 'data', 'e-money', 'games']),
            ],
            'categories' => $activeCategory,
            'filters' => [
                'brand' => $brand,
                'search' => $search,
            ],
        ]);
    }

    public function inquiry(Request $request, DigiflazzService $digiflazz)
    {
        $validated = $request->validate([
            'customer_no' => ['required', 'string', 'max:20'],
            'category' => ['required', 'string', 'max:100'],
        ]);

        $customerNo = preg_replace('/[^0-9]/', '', $validated['customer_no']);

        if (strlen($customerNo) < 6) {
            return response()->json(['message' => 'Nomor pelanggan minimal 6 digit'], 422);
        }

        $isSupported = in_array(strtolower($validated['category']), ['pln', 'bpjs', 'pdam', 'telkom', 'pbb', 'gas']);

        if (! $isSupported) {
            return response()->json([
                'customer_no' => $customerNo,
                'customer_name' => null,
                'unavailable' => true,
                'message' => 'Verifikasi tidak tersedia untuk kategori ini. Lanjutkan pembelian jika yakin nomor benar.',
            ]);
        }

        $result = $digiflazz->inquiry($customerNo, $validated['category']);

        if (! $result) {
            return response()->json([
                'customer_no' => $customerNo,
                'customer_name' => null,
                'unavailable' => true,
                'message' => 'Gagal terhubung ke server. Coba lagi nanti.',
            ]);
        }

        $status = $result['status'] ?? '';

        if ($status === 'Gagal') {
            return response()->json([
                'customer_no' => $customerNo,
                'customer_name' => null,
                'not_found' => true,
                'message' => $result['message'] ?? 'Nomor tidak ditemukan',
            ]);
        }

        $customerName = $result['customer_name'] ?? $result['name'] ?? null;
        $segmentPower = $result['segment_power'] ?? $result['segment'] ?? null;

        if ($customerName) {
            return response()->json([
                'customer_no' => $result['customer_no'] ?? $customerNo,
                'customer_name' => $customerName,
                'segment_power' => $segmentPower,
                'detail' => $result['desc'] ?? null,
            ]);
        }

        return response()->json([
            'customer_no' => $customerNo,
            'customer_name' => null,
            'unavailable' => true,
            'message' => 'Verifikasi tidak dapat diproses untuk nomor ini. Lanjutkan jika yakin nomor benar.',
        ]);
    }

    public function order(Request $request, MidtransService $midtrans)
    {
        $validated = $request->validate([
            'buyer_sku_code' => ['required', 'exists:ppob_products,buyer_sku_code'],
            'customer_no' => ['required', 'string', 'max:20'],
            'customer_name' => ['nullable', 'string', 'max:100'],
        ]);

        $product = PpobProduct::active()->where('buyer_sku_code', $validated['buyer_sku_code'])->firstOrFail();

        $customerNo = preg_replace('/[^0-9]/', '', $validated['customer_no']);
        $customerName = $validated['customer_name'] ?? null;

        $isPhoneCategory = in_array(strtolower($product->category), ['pulsa', 'data', 'e-money', 'games']);

        if ($isPhoneCategory && ! preg_match('/^08[0-9]{6,11}$/', $customerNo)) {
            return back()->with('error', 'Nomor HP harus diawali 08 dan minimal 8 digit');
        }

        if (! $isPhoneCategory && strlen($customerNo) < 6) {
            return back()->with('error', 'Nomor pelanggan minimal 6 digit');
        }

        $tenant = $this->getAssignedTenant();

        if (! $tenant) {
            return back()->with('error', 'Tidak ada toko yang tersedia untuk PPOB');
        }

        DB::beginTransaction();
        try {
            $orderNumber = 'PPOB-'.now()->format('Ymd').'-'.strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));

            $order = Order::create([
                'type' => 'ppob',
                'order_number' => $orderNumber,
                'user_id' => Auth::id(),
                'tenant_id' => $tenant->id,
                'status' => 'pending',
                'subtotal' => $product->buyer_price,
                'shipping_cost' => 0,
                'total' => $product->buyer_price,
                'payment_status' => 'unpaid',
                'shipping_address' => 'PPOB - Digital Product',
                'recipient_name' => Auth::user()->name,
                'recipient_phone' => Auth::user()->phone ?? Auth::user()->email,
                'customer_phone' => $customerNo,
                'ppob_customer_name' => $customerName,
                'ppob_category' => $product->category,
                'ppob_brand' => $product->brand,
                'ppob_buyer_sku_code' => $product->buyer_sku_code,
                'ppob_seller_price' => $product->seller_price,
                'ppob_markup' => $product->buyer_price - $product->seller_price,
            ]);

            $order->items()->create([
                'product_name' => $product->product_name,
                'quantity' => 1,
                'price' => $product->buyer_price,
                'subtotal' => $product->buyer_price,
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Gagal membuat pesanan: '.$e->getMessage());
        }

        $staffUserIds = TenantUser::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->pluck('user_id');
        $staffUsers = User::whereIn('id', $staffUserIds)->get();
        Notification::send($staffUsers, new NewOrder($order, 'created'));
        foreach ($staffUsers as $staff) {
            try {
                NewNotification::dispatch(
                    $staff->id,
                    [
                        'id' => (string) $staff->notifications()->latest()->first()?->id,
                        'type' => 'NewOrder',
                        'data' => [
                            'order_number' => $order->order_number,
                            'total' => $order->total,
                            'customer_name' => Auth::user()->name,
                            'event' => 'created',
                            'message' => "Pesanan PPOB baru: {$order->order_number}",
                        ],
                        'created_at' => 'Baru saja',
                    ],
                    $staff->unreadNotifications()->count(),
                );
            } catch (\Throwable $e) {
                // Broadcast gagal (Reverb tidak jalan), tidak perlu gagalkan request
            }
        }

        $response = $midtrans->chargeQris($order, $order->order_number);

        if ($response && in_array($response['status_code'] ?? '', ['201', '200'])) {
            $transactionId = $response['transaction_id'] ?? null;
            $qrUrl = null;

            if (isset($response['actions'])) {
                foreach ($response['actions'] as $action) {
                    if ($action['name'] === 'generate-qr-code') {
                        $qrUrl = $action['url'];
                        break;
                    }
                }
            }

            $order->update([
                'midtrans_order_id' => $order->order_number,
                'midtrans_transaction_id' => $transactionId,
            ]);

            session()->flash('qris_qr_url', $qrUrl);
            session()->flash('qris_transaction_id', $transactionId);

            return redirect()->route('marketplace.orders.show', $order);
        }

        return redirect()->route('marketplace.orders.show', $order)
            ->with('success', 'Pesanan PPOB berhasil dibuat. Silakan lakukan pembayaran.');
    }

    public function orders()
    {
        $orders = Order::ppob()
            ->where('user_id', Auth::id())
            ->with(['items'])
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'status' => $o->status,
                'total' => $o->total,
                'payment_status' => $o->payment_status,
                'digiflazz_status' => $o->digiflazz_status,
                'digiflazz_sn' => $o->digiflazz_sn,
                'customer_phone' => $o->customer_phone,
                'customer_name' => $o->ppob_customer_name,
                'ppob_category' => $o->ppob_category,
                'ppob_product' => $o->items->first()?->product_name,
                'midtrans_redirect_url' => $o->midtrans_redirect_url,
                'created_at' => $o->created_at->format('d M Y H:i'),
                'created_timestamp' => $o->created_at->timestamp,
            ]);

        return Inertia::render('marketplace/ppob/orders', [
            'orders' => $orders,
        ]);
    }

    protected function getAssignedTenant(): ?Tenant
    {
        return Tenant::where('subscription_status', 'active')
            ->whereHas('products')
            ->latest()
            ->first();
    }

    protected function getCategoryIcon(string $category): string
    {
        $icons = [
            'Pulsa' => 'smartphone',
            'Data' => 'wifi',
            'PLN' => 'zap',
            'BPJS' => 'heart-pulse',
            'PDAM' => 'droplets',
            'Telkom' => 'phone',
            'E-Money' => 'wallet',
            'Game' => 'gamepad-2',
            'Voucher' => 'ticket',
        ];

        return $icons[$category] ?? 'shopping-bag';
    }
}
