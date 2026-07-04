<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\CustomerBankAccount;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\BillingService;
use App\Services\MidtransService;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function dashboard(Request $request, MidtransService $midtrans)
    {
        $user = $request->user();

        $customer = Customer::where('user_id', $user->id)->first();

        $this->syncPendingOrders($midtrans, $user->id);

        $totalSpending = Order::where('user_id', $user->id)
            ->where('payment_status', 'paid')
            ->sum('total');

        $latestOrder = Order::where('user_id', $user->id)
            ->with(['items.product', 'tenant'])
            ->latest()
            ->first();

        $activeOrder = null;
        if ($latestOrder && in_array($latestOrder->status, ['pending', 'confirmed', 'shipped'])) {
            $activeOrder = $this->formatOrderTracking($latestOrder);
        }

        $orders = Order::where('user_id', $user->id)
            ->with(['items.product', 'tenant:id,slug,name,logo'])
            ->withExists('review')
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'status' => $o->status,
                'total' => $o->total,
                'payment_status' => $o->payment_status,
                'has_review' => $o->review_exists,
                'item_count' => $o->items->sum('quantity'),
                'store_name' => $o->tenant->name,
                'store_slug' => $o->tenant->slug,
                'store_logo' => $o->tenant->logo ? Storage::disk('public')->url($o->tenant->logo) : null,
                'created_at' => $o->created_at->format('d M Y H:i'),
                'created_timestamp' => $o->created_at->timestamp,
                'items' => $o->items->map(fn ($i) => [
                    'id' => $i->id,
                    'product_name' => $i->product_name,
                    'variant_name' => $i->variant_name,
                    'quantity' => $i->quantity,
                    'price' => $i->price,
                    'subtotal' => $i->subtotal,
                    'image_url' => $i->product?->image_url,
                ]),
            ]);

        $recentOrders = Order::where('user_id', $user->id)
            ->with('items.product', 'tenant')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($o) => $this->formatOrderTracking($o));

        $recommendations = Product::where('visible_online', true)
            ->with('tenant', 'category')
            ->inRandomOrder()
            ->take(4)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug ?? $p->id,
                'price' => $p->display_price,
                'image' => $p->image_url,
                'category' => $p->category?->name ?? 'Umum',
                'rating' => 4.8,
                'tenant_slug' => $p->tenant?->slug,
            ]);

        $addresses = $customer
            ? CustomerAddress::where('customer_id', $customer->id)->latest()->get()
            : collect();

        $bankAccounts = $customer
            ? $customer->bankAccounts()->latest()->get()
            : collect();

        $stats = [
            'total_spending' => $totalSpending,
            'total_orders' => Order::where('user_id', $user->id)->count(),
            'completed_orders' => Order::where('user_id', $user->id)->where('status', 'completed')->count(),
            'reward_points' => 1250,
            'available_vouchers' => 5,
            'address_count' => $addresses->count(),
        ];

        return Inertia::render('marketplace/customer-dashboard', [
            'stats' => $stats,
            'activeOrder' => $activeOrder,
            'recentOrders' => $recentOrders,
            'orders' => $orders,
            'recommendations' => $recommendations,
            'memberLevel' => 'Silver',
            'pointsToNextLevel' => 300,
            'addresses' => $addresses,
            'bankAccounts' => $bankAccounts,
            'complaints' => Complaint::where('user_id', $user->id)
                ->with(['order.tenant:id,name', 'order.items.product'])
                ->latest()
                ->paginate(10)
                ->withQueryString()
                ->through(fn ($c) => [
                    'id' => $c->id,
                    'order_id' => $c->order_id,
                    'order_number' => $c->order->order_number,
                    'store_name' => $c->order->tenant->name,
                    'reason' => $c->reason,
                    'reason_label' => match ($c->reason) {
                        'wrong_product' => 'Produk Tidak Sesuai',
                        'damaged' => 'Produk Rusak',
                        'not_received' => 'Pesanan Belum Diterima',
                        'other' => 'Lainnya',
                    },
                    'description' => $c->description,
                    'status' => $c->status,
                    'resolution' => $c->resolution,
                    'created_at' => $c->created_at->format('d M Y'),
                    'items' => $c->order->items->map(fn ($i) => [
                        'product_name' => $i->product_name,
                        'variant_name' => $i->variant_name,
                        'quantity' => $i->quantity,
                        'price' => $i->price,
                        'image_url' => $i->product?->image_url,
                    ]),
                ]),
            'initialSection' => $request->route('initialSection', $request->query('section', 'beranda')),
            'notifications' => $user->notifications()
                ->orderBy('created_at', 'desc')
                ->take(20)
                ->get()
                ->map(fn ($n) => [
                    'id' => $n->id,
                    'type' => class_basename($n->type),
                    'data' => $n->data,
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at->diffForHumans(),
                ]),
            'unreadCount' => $user->unreadNotifications()->count(),
        ]);
    }

    public function showCreateStore(): Response
    {
        return Inertia::render('marketplace/create-store');
    }

    public function createStore(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->has_store) {
            return redirect()->route('marketplace.customer.dashboard')
                ->withErrors(['form' => 'Anda sudah memiliki toko.']);
        }

        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        DB::transaction(function () use ($validated, $user) {
            $slug = Str::slug($validated['store_name']);
            $original = $slug;
            $i = 1;
            while (Tenant::where('slug', $slug)->exists()) {
                $slug = $original.'-'.$i++;
            }

            $tenant = Tenant::create([
                'name' => $validated['store_name'],
                'slug' => $slug,
                'address' => $validated['address'] ?? null,
                'phone' => $validated['phone'] ?? null,
            ]);

            TenantUser::create([
                'user_id' => $user->id,
                'tenant_id' => $tenant->id,
                'role' => 'owner',
            ]);

            (new RoleAndPermissionSeeder)->run($tenant->id);

            foreach ([
                ['Cash', 'Cash'], ['QRIS', 'E-Wallet'], ['GoPay', 'E-Wallet'],
                ['ShopeePay', 'E-Wallet'], ['BCA', 'Bank'], ['Mandiri', 'Bank'], ['BRI', 'Bank'],
            ] as [$name, $type]) {
                PaymentMethod::create(['name' => $name, 'type' => $type, 'is_active' => true, 'tenant_id' => $tenant->id]);
            }

            $user->assignRole('admin');

            app(BillingService::class)->applyTrial($tenant);
        });

        $tenantUser = TenantUser::where('user_id', $user->id)
            ->where('role', 'owner')
            ->first();

        if ($tenantUser) {
            session(['tenant_id' => $tenantUser->tenant_id]);
            app()->instance('current.tenant', $tenantUser->tenant);
            config()->set('permission.cache.key', 'spatie.permission.cache.'.$tenantUser->tenant_id);
        }

        $request->session()->save();

        return redirect('/dashboard')->with('status', 'Toko berhasil dibuat!');
    }

    public function storeAddress(Request $request)
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:255'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['required', 'string', 'max:500'],
            'city' => ['required', 'string', 'max:255'],
            'province' => ['required', 'string', 'max:255'],
            'rajaongkir_city_id' => ['nullable', 'string', 'max:10'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'is_default' => ['nullable', 'boolean'],
        ]);

        $customer = Customer::where('user_id', Auth::id())->first();

        if (! $customer) {
            return back()->with('error', 'Akun pelanggan tidak ditemukan.');
        }

        if ($request->boolean('is_default')) {
            CustomerAddress::where('customer_id', $customer->id)->update(['is_default' => false]);
        }

        CustomerAddress::create([
            'customer_id' => $customer->id,
            ...$validated,
        ]);

        return back()->with('success', 'Alamat berhasil ditambahkan.');
    }

    public function updateAddress(Request $request, CustomerAddress $address)
    {
        $customer = Customer::where('user_id', Auth::id())->first();

        if (! $customer || $address->customer_id !== $customer->id) {
            return back()->with('error', 'Alamat tidak ditemukan.');
        }

        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:255'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['required', 'string', 'max:500'],
            'city' => ['required', 'string', 'max:255'],
            'province' => ['required', 'string', 'max:255'],
            'rajaongkir_city_id' => ['nullable', 'string', 'max:10'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'is_default' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('is_default')) {
            CustomerAddress::where('customer_id', $customer->id)->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        $address->update($validated);

        return back()->with('success', 'Alamat berhasil diperbarui.');
    }

    public function destroyAddress(CustomerAddress $address)
    {
        $customer = Customer::where('user_id', Auth::id())->first();

        if (! $customer || $address->customer_id !== $customer->id) {
            return back()->with('error', 'Alamat tidak ditemukan.');
        }

        $address->delete();

        return back()->with('success', 'Alamat berhasil dihapus.');
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (! $customer) {
            return back()->with('error', 'Akun pelanggan tidak ditemukan.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $user->update(['name' => $validated['name'], 'email' => $validated['email']]);
        $customer->update($validated);

        return back()->with('success', 'Profil berhasil diperbarui.');
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $request->user()->update(['password' => $validated['new_password']]);

        return back()->with('success', 'Password berhasil diubah.');
    }

    public function uploadAvatar(Request $request)
    {
        $validated = $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();

        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $path = $request->file('photo')->store('profile-photos', 'public');
        $user->update(['profile_photo_path' => $path]);

        return back()->with('success', 'Foto profil berhasil diperbarui.');
    }

    public function storeBankAccount(Request $request)
    {
        $customer = Customer::where('user_id', Auth::id())->first();

        if (! $customer) {
            return back()->with('error', 'Akun pelanggan tidak ditemukan.');
        }

        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:50'],
            'account_holder_name' => ['required', 'string', 'max:255'],
            'is_default' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('is_default')) {
            $customer->bankAccounts()->update(['is_default' => false]);
        }

        $customer->bankAccounts()->create($validated);

        return back()->with('success', 'Rekening bank berhasil ditambahkan.');
    }

    public function updateBankAccount(Request $request, CustomerBankAccount $bankAccount)
    {
        $customer = Customer::where('user_id', Auth::id())->first();

        if (! $customer || $bankAccount->customer_id !== $customer->id) {
            return back()->with('error', 'Rekening tidak ditemukan.');
        }

        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:50'],
            'account_holder_name' => ['required', 'string', 'max:255'],
            'is_default' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('is_default')) {
            $customer->bankAccounts()->where('id', '!=', $bankAccount->id)->update(['is_default' => false]);
        }

        $bankAccount->update($validated);

        return back()->with('success', 'Rekening bank berhasil diperbarui.');
    }

    public function destroyBankAccount(CustomerBankAccount $bankAccount)
    {
        $customer = Customer::where('user_id', Auth::id())->first();

        if (! $customer || $bankAccount->customer_id !== $customer->id) {
            return back()->with('error', 'Rekening tidak ditemukan.');
        }

        $bankAccount->delete();

        return back()->with('success', 'Rekening bank berhasil dihapus.');
    }

    private function syncPendingOrders(MidtransService $midtrans, int $userId): void
    {
        $pendingOrders = Order::where('user_id', $userId)
            ->where('payment_status', 'unpaid')
            ->whereNotNull('midtrans_transaction_id')
            ->get();

        foreach ($pendingOrders as $order) {
            $statusResponse = $midtrans->getTransactionStatus($order->order_number);
            if (! $statusResponse) {
                continue;
            }

            $transactionStatus = $statusResponse['transaction_status'] ?? '';
            $transactionId = $statusResponse['transaction_id'] ?? $order->midtrans_transaction_id;
            $paymentType = $statusResponse['payment_type'] ?? null;
            $bank = $statusResponse['bank'] ?? ($statusResponse['va_numbers'][0]['bank'] ?? null);
            $vaNumber = $statusResponse['va_numbers'][0]['va_number'] ?? ($statusResponse['bill_key'] ?? ($statusResponse['payment_code'] ?? null));

            if (in_array($transactionStatus, ['capture', 'settlement'])) {
                $order->update([
                    'payment_status' => 'paid',
                    'status' => 'confirmed',
                    'midtrans_transaction_id' => $transactionId,
                ]);
            }

            $order->payments()->updateOrCreate(
                ['midtrans_transaction_id' => $transactionId],
                [
                    'payment_type' => $paymentType,
                    'bank' => $bank,
                    'va_number' => $vaNumber,
                    'gross_amount' => $statusResponse['gross_amount'] ?? $order->total,
                    'status' => $transactionStatus,
                    'raw_response' => $statusResponse,
                ]
            );
        }
    }

    private function formatOrderTracking($o): array
    {
        $statusOrder = ['pending' => 0, 'confirmed' => 1, 'shipped' => 2, 'completed' => 3, 'cancelled' => -1];
        $current = $statusOrder[$o->status] ?? 0;

        return [
            'id' => $o->id,
            'order_number' => $o->order_number,
            'total' => $o->total,
            'status' => $o->status,
            'payment_status' => $o->payment_status,
            'store_name' => $o->tenant?->name,
            'created_at' => $o->created_at->format('d M Y'),
            'item_count' => $o->items->count(),
            'progress' => max(0, $current),
            'first_item' => $o->items->first() ? [
                'name' => $o->items->first()->product_name,
                'price' => $o->items->first()->price,
                'image' => $o->items->first()->product?->image_url,
            ] : null,
            'items' => $o->items->map(fn ($i) => [
                'id' => $i->id,
                'product_name' => $i->product_name,
                'variant_name' => $i->variant_name,
                'quantity' => $i->quantity,
                'price' => $i->price,
                'subtotal' => $i->subtotal,
                'image_url' => $i->product?->image_url,
            ]),
        ];
    }

    public function storeComplaint(Request $request): RedirectResponse
    {
        $validated = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'reason' => 'required|in:wrong_product,damaged,not_received,other',
            'description' => 'required|string|max:2000',
        ])->validate();

        $order = Order::findOrFail($validated['order_id']);

        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if ($order->status !== 'completed') {
            return back()->with('error', 'Hanya pesanan selesai yang bisa dikomplain.');
        }

        if (Complaint::where('order_id', $order->id)->exists()) {
            return back()->with('error', 'Pesanan ini sudah dikomplain.');
        }

        Complaint::create([
            'order_id' => $order->id,
            'user_id' => Auth::id(),
            'tenant_id' => $order->tenant_id,
            'reason' => $validated['reason'],
            'description' => $validated['description'],
        ]);

        return back()->with('success', 'Komplain berhasil diajukan.');
    }

    public function cancelComplaint(Complaint $complaint): RedirectResponse
    {
        if ($complaint->user_id !== Auth::id()) {
            abort(403);
        }

        if ($complaint->status !== 'pending') {
            return back()->with('error', 'Hanya komplain pending yang bisa dibatalkan.');
        }

        $complaint->delete();

        return back()->with('success', 'Komplain berhasil dibatalkan.');
    }
}
