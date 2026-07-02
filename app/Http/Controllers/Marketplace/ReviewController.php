<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function create(Order $order): Response|RedirectResponse
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if ($order->status !== 'completed') {
            return redirect()->route('marketplace.orders.show', $order)
                ->with('error', 'Pesanan belum selesai, belum bisa diulas.');
        }

        if ($order->review()->exists()) {
            return redirect()->route('marketplace.orders.show', $order)
                ->with('error', 'Pesanan ini sudah diulas.');
        }

        $order->load('tenant:id,slug,name,logo');

        return Inertia::render('marketplace/review-create', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'store_name' => $order->tenant->name,
                'store_slug' => $order->tenant->slug,
                'total' => $order->total,
                'items' => $order->items->map(fn ($i) => [
                    'product_name' => $i->product_name,
                    'quantity' => $i->quantity,
                ]),
            ],
        ]);
    }

    public function store(Request $request, Order $order): RedirectResponse
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if ($order->status !== 'completed') {
            return redirect()->route('marketplace.orders.show', $order)
                ->with('error', 'Pesanan belum selesai, belum bisa diulas.');
        }

        if ($order->review()->exists()) {
            return redirect()->route('marketplace.orders.show', $order)
                ->with('error', 'Pesanan ini sudah diulas.');
        }

        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:2000',
        ]);

        $order->review()->create([
            'user_id' => Auth::id(),
            'tenant_id' => $order->tenant_id,
            'rating' => $data['rating'],
            'review' => $data['review'],
        ]);

        return redirect()->route('marketplace.orders.show', $order)
            ->with('success', 'Ulasan berhasil dikirim. Terima kasih!');
    }
}
