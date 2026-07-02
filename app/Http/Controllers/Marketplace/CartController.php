<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CartController extends Controller
{
    public function index()
    {
        $cartItems = Cart::where('user_id', Auth::id())
            ->with(['product' => fn ($q) => $q->withTrashed(), 'variant'])
            ->latest()
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'product_id' => $c->product_id,
                'product_slug' => $c->product?->slug,
                'product_name' => $c->product?->name ?? 'Produk tidak tersedia',
                'product_image' => $c->product?->image_url,
                'variant_name' => $c->variant?->name,
                'price' => $c->variant
                    ? ($c->product->display_price + $c->variant->additional_price)
                    : $c->product->display_price,
                'quantity' => $c->quantity,
                'subtotal' => ($c->variant
                    ? ($c->product->display_price + $c->variant->additional_price)
                    : $c->product->display_price) * $c->quantity,
                'stock' => $c->variant?->stock ?? $c->product->available_stock,
                'store_name' => $c->product?->tenant->name,
                'store_slug' => $c->product?->tenant->slug,
            ]);

        $total = $cartItems->sum('subtotal');

        return Inertia::render('marketplace/cart', [
            'cartItems' => $cartItems,
            'total' => $total,
            'itemCount' => $cartItems->count(),
        ]);
    }

    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $existing = Cart::where('user_id', Auth::id())
            ->where('product_id', $validated['product_id'])
            ->where('product_variant_id', $validated['product_variant_id'])
            ->first();

        if ($existing) {
            $existing->increment('quantity', $validated['quantity']);
        } else {
            Cart::create([
                'user_id' => Auth::id(),
                'product_id' => $validated['product_id'],
                'product_variant_id' => $validated['product_variant_id'],
                'quantity' => $validated['quantity'],
            ]);
        }

        $count = Cart::where('user_id', Auth::id())->sum('quantity');

        return redirect()->back()->with('success', 'Produk ditambahkan ke keranjang');
    }

    public function update(Request $request, Cart $cart)
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $cart->update(['quantity' => $validated['quantity']]);

        return redirect()->back()->with('success', 'Keranjang diperbarui');
    }

    public function remove(Cart $cart)
    {
        $cart->delete();

        return redirect()->back()->with('success', 'Produk dihapus dari keranjang');
    }
}
