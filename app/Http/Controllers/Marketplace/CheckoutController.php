<?php

namespace App\Http\Controllers\Marketplace;

use App\Events\NewNotification;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\TenantUser;
use App\Models\User;
use App\Notifications\NewOrder;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function index(Request $request)
    {
        $cartItems = Cart::where('user_id', Auth::id())
            ->with(['product.tenant', 'variant'])
            ->get();

        if ($cartItems->isEmpty()) {
            return redirect()->route('marketplace.cart');
        }

        // Filter by selected cart IDs if provided
        if ($request->query('selected')) {
            $selectedIds = collect(explode(',', $request->query('selected')))
                ->map(fn ($id) => (int) trim($id))
                ->filter()
                ->toArray();
            if (! empty($selectedIds)) {
                $cartItems = $cartItems->whereIn('id', $selectedIds);
            }
        }

        $customer = Customer::where('user_id', Auth::id())->first();
        $addresses = $customer
            ? CustomerAddress::where('customer_id', $customer->id)->latest()->get()
            : collect();

        $groupedByStore = $cartItems->groupBy(fn ($c) => $c->product->tenant_id);

        $stores = [];
        $subtotal = 0;

        foreach ($groupedByStore as $tenantId => $items) {
            $tenant = $items->first()->product->tenant;
            $storeSubtotal = 0;

            $storeItems = $items->map(function ($c) use (&$storeSubtotal) {
                $price = $c->variant
                    ? ($c->product->display_price + $c->variant->additional_price)
                    : $c->product->display_price;
                $storeSubtotal += $price * $c->quantity;

                $weight = $c->variant?->weight ?? $c->product->weight;

                return [
                    'cart_id' => $c->id,
                    'product_id' => $c->product_id,
                    'product_name' => $c->product->name,
                    'product_image' => $c->product->image_url,
                    'variant_name' => $c->variant?->name,
                    'price' => $price,
                    'quantity' => $c->quantity,
                    'subtotal' => $price * $c->quantity,
                    'weight' => $weight,
                ];
            });

            $subtotal += $storeSubtotal;

            $stores[] = [
                'tenant_id' => $tenant->id,
                'store_name' => $tenant->name,
                'store_slug' => $tenant->slug,
                'shipping_cost' => $tenant->shipping_cost,
                'rajaongkir_city_id' => $tenant->rajaongkir_city_id,
                'items' => $storeItems,
                'store_subtotal' => $storeSubtotal,
                'store_total' => $storeSubtotal + $tenant->shipping_cost,
            ];
        }

        $total = collect($stores)->sum('store_total');

        return Inertia::render('marketplace/checkout', [
            'stores' => $stores,
            'subtotal' => $subtotal,
            'total' => $total,
            'addresses' => $addresses,
            'clientKey' => config('midtrans.client_key'),
        ]);
    }

    public function process(Request $request, MidtransService $midtrans)
    {
        $rules = [
            'notes' => ['nullable', 'string', 'max:500'],
            'shipping' => ['nullable', 'array'],
            'shipping.*.tenant_id' => ['required_with:shipping', 'integer'],
            'shipping.*.courier' => ['nullable', 'string', 'max:50'],
            'shipping.*.service' => ['nullable', 'string', 'max:100'],
            'shipping.*.cost' => ['nullable', 'numeric', 'min:0'],
            'selected' => ['nullable', 'string'],
        ];

        if ($request->has('address_id') && $request->input('address_id')) {
            $rules['address_id'] = ['required', 'exists:customer_addresses,id'];
        } else {
            $rules['recipient_name'] = ['required', 'string', 'max:255'];
            $rules['phone'] = ['required', 'string', 'max:20'];
            $rules['address'] = ['required', 'string', 'max:500'];
            $rules['city'] = ['required', 'string', 'max:255'];
            $rules['province'] = ['required', 'string', 'max:255'];
            $rules['rajaongkir_city_id'] = ['nullable', 'string', 'max:10'];
            $rules['postal_code'] = ['nullable', 'string', 'max:10'];
            $rules['label'] = ['nullable', 'string', 'max:255'];
        }

        $validated = $request->validate($rules);

        if (isset($validated['address_id'])) {
            $address = CustomerAddress::findOrFail($validated['address_id']);
        } else {
            $customer = Customer::where('user_id', Auth::id())->first();

            if (! $customer) {
                return back()->with('error', 'Akun pelanggan tidak ditemukan.');
            }

            $address = CustomerAddress::create([
                'customer_id' => $customer->id,
                'label' => $validated['label'] ?? null,
                'recipient_name' => $validated['recipient_name'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'city' => $validated['city'],
                'province' => $validated['province'],
                'rajaongkir_city_id' => $validated['rajaongkir_city_id'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
            ]);
        }

        $shippingData = collect($validated['shipping'] ?? [])->keyBy('tenant_id');

        $cartItems = Cart::where('user_id', Auth::id())
            ->with(['product.tenant', 'variant'])
            ->get();

        if ($cartItems->isEmpty()) {
            return back()->with('error', 'Keranjang belanja kosong');
        }

        // Filter by selected cart IDs if provided
        if (! empty($validated['selected'])) {
            $selectedIds = collect(explode(',', $validated['selected']))
                ->map(fn ($id) => (int) trim($id))
                ->filter()
                ->toArray();
            if (! empty($selectedIds)) {
                $cartItems = $cartItems->whereIn('id', $selectedIds);
            }
        }

        $groupedByStore = $cartItems->groupBy(fn ($c) => $c->product->tenant_id);

        $orders = [];

        DB::beginTransaction();
        try {
            foreach ($groupedByStore as $tenantId => $items) {
                $tenant = $items->first()->product->tenant;
                $subtotal = 0;

                $orderItemsData = [];
                foreach ($items as $c) {
                    $price = $c->variant
                        ? ($c->product->display_price + $c->variant->additional_price)
                        : $c->product->display_price;
                    $quantity = min($c->quantity, $c->variant?->stock ?? $c->product->available_stock);
                    $subtotal += $price * $quantity;

                    $orderItemsData[] = [
                        'product_id' => $c->product_id,
                        'product_variant_id' => $c->product_variant_id,
                        'product_name' => $c->product->name,
                        'variant_name' => $c->variant?->name,
                        'quantity' => $quantity,
                        'price' => $price,
                        'subtotal' => $price * $quantity,
                    ];
                }

                $orderNumber = 'INV-'.now()->format('Ymd').'-'.strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));

                $ship = $shippingData->get($tenantId);
                $shippingCost = $ship['cost'] ?? $tenant->shipping_cost;

                $order = Order::create([
                    'order_number' => $orderNumber,
                    'user_id' => Auth::id(),
                    'tenant_id' => $tenantId,
                    'status' => 'pending',
                    'subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'total' => $subtotal + $shippingCost,
                    'payment_status' => 'unpaid',
                    'shipping_address' => implode(', ', array_filter([
                        $address->address,
                        $address->city,
                        $address->province,
                        $address->postal_code,
                    ])),
                    'recipient_name' => $address->recipient_name,
                    'recipient_phone' => $address->phone,
                    'notes' => $validated['notes'],
                    'shipping_courier' => $ship['courier'] ?? null,
                    'shipping_service' => $ship['service'] ?? null,
                ]);

                foreach ($orderItemsData as $itemData) {
                    $order->items()->create($itemData);
                }

                $orders[] = $order;

                $tenantUserIds = TenantUser::where('tenant_id', $tenantId)
                    ->where('is_active', true)
                    ->pluck('user_id');
                $staffUsers = User::whereIn('id', $tenantUserIds)->get();

                try {
                    Notification::send($staffUsers, new NewOrder($order, 'created'));
                    foreach ($staffUsers as $staff) {
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
                                    'message' => "Pesanan baru: {$order->order_number}",
                                ],
                                'created_at' => 'Baru saja',
                            ],
                            $staff->unreadNotifications()->count(),
                        );
                    }
                } catch (\Throwable $e) {
                    // Broadcast gagal (Reverb tidak jalan), tidak perlu gagalkan request
                }
            }

            Cart::where('user_id', Auth::id())->delete();

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            Log::error('Checkout transaction failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Gagal memproses pesanan: '.$e->getMessage());
        }

        if (count($orders) === 1) {
            $order = $orders[0];

            try {
                $response = $midtrans->chargeQris($order, $order->order_number);
            } catch (\Throwable $e) {
                Log::error('Midtrans charge error after order creation', [
                    'order' => $order->order_number,
                    'error' => $e->getMessage(),
                ]);
                $response = null;
            }

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
                ->with('success', 'Pesanan berhasil dibuat');
        }

        return redirect()->route('marketplace.orders')
            ->with('success', 'Semua pesanan berhasil dibuat');
    }
}
