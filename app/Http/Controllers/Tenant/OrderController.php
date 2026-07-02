<?php

namespace App\Http\Controllers\Tenant;

use App\Events\NewNotification;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Notifications\NewOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('manage-pos');

        $tenant = tenant();
        if ($tenant && ! $tenant->canMarketplace()) {
            return redirect()->route('billing.index')->with('error', 'Fitur online orders hanya tersedia untuk Premium. Upgrade sekarang!');
        }

        $status = $request->get('status');
        $search = $request->get('search');

        $orders = Order::where('tenant_id', tenant_id())
            ->with(['items', 'user:id,name,email'])
            ->when($status, fn ($q, $s) => $q->where('status', $s))
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhere('recipient_name', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'status' => $o->status,
                'total' => $o->total,
                'payment_status' => $o->payment_status,
                'subtotal' => $o->subtotal,
                'shipping_cost' => $o->shipping_cost,
                'shipping_courier' => $o->shipping_courier,
                'shipping_service' => $o->shipping_service,
                'shipping_address' => $o->shipping_address,
                'tracking_number' => $o->tracking_number,
                'item_count' => $o->items->sum('quantity'),
                'customer_name' => $o->user?->name ?? 'Pengguna',
                'customer_email' => $o->user?->email ?? '-',
                'recipient_name' => $o->recipient_name,
                'recipient_phone' => $o->recipient_phone,
                'type' => $o->type,
                'created_at' => $o->created_at->format('d M Y H:i'),
                'items' => $o->items->map(fn ($i) => [
                    'product_name' => $i->product_name,
                    'variant_name' => $i->variant_name,
                    'quantity' => $i->quantity,
                    'price' => $i->price,
                    'subtotal' => $i->subtotal,
                ]),
            ]);

        $summary = [
            'total' => Order::where('tenant_id', tenant_id())->count(),
            'pending' => Order::where('tenant_id', tenant_id())->where('status', 'pending')->count(),
            'confirmed' => Order::where('tenant_id', tenant_id())->where('status', 'confirmed')->count(),
            'shipped' => Order::where('tenant_id', tenant_id())->where('status', 'shipped')->count(),
            'completed' => Order::where('tenant_id', tenant_id())->where('status', 'completed')->count(),
            'cancelled' => Order::where('tenant_id', tenant_id())->where('status', 'cancelled')->count(),
        ];

        return Inertia::render('tenant/online-orders', [
            'orders' => $orders,
            'filters' => ['status' => $status, 'search' => $search],
            'summary' => $summary,
        ]);
    }

    public function update(Request $request, Order $order)
    {
        Gate::authorize('manage-pos');

        $tenant = tenant();
        if ($tenant && ! $tenant->canMarketplace()) {
            return redirect()->route('billing.index')->with('error', 'Fitur online orders hanya tersedia untuk Premium. Upgrade sekarang!');
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:confirmed,shipped,completed,cancelled'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'shipping_courier' => ['nullable', 'string', 'max:100'],
            'shipping_address' => ['nullable', 'string', 'max:500'],
        ]);

        $order->update([
            'status' => $validated['status'],
            'tracking_number' => $validated['tracking_number'] ?? $order->tracking_number,
            'shipping_courier' => $validated['shipping_courier'] ?? $order->shipping_courier,
            'shipping_address' => $validated['shipping_address'] ?? $order->shipping_address,
        ]);

        $customer = $order->user;
        if ($customer) {
            $customer->notify(new NewOrder($order, $validated['status']));
            try {
                NewNotification::dispatch(
                    $customer->id,
                    [
                        'id' => (string) $customer->notifications()->latest()->first()?->id,
                        'type' => 'NewOrder',
                        'data' => [
                            'order_number' => $order->order_number,
                            'total' => $order->total,
                            'event' => $validated['status'],
                            'message' => match ($validated['status']) {
                                'confirmed' => "Pesanan dikonfirmasi: {$order->order_number}",
                                'shipped' => "Pesanan dikirim: {$order->order_number}",
                                'completed' => "Pesanan selesai: {$order->order_number}",
                                'cancelled' => "Pesanan dibatalkan: {$order->order_number}",
                                default => "Status pesanan berubah: {$order->order_number}",
                            },
                        ],
                        'created_at' => 'Baru saja',
                    ],
                    $customer->unreadNotifications()->count(),
                );
            } catch (\Throwable $e) {
                // Broadcast gagal (Reverb tidak jalan), tidak perlu gagalkan request
            }
        }

        return back()->with('success', 'Status pesanan diperbarui');
    }
}
