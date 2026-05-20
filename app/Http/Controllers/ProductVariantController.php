<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;

class ProductVariantController extends Controller
{
    /**
     * Menyimpan atau memperbarui banyak varian sekaligus untuk satu produk.
     */
    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'variants' => 'required|array|min:1',
            'variants.*.id' => 'nullable|exists:product_variants,id',
            'variants.*.name' => 'required|string|max:255',
            'variants.*.additional_price' => 'required|numeric|min:0',
            'variants.*.stock' => 'required|integer|min:0',
            'variants.*.sku' => 'nullable|string|max:100',
        ]);

        try {
            DB::transaction(function () use ($product, $validated) {
                // Ambil ID varian yang dikirim untuk identifikasi mana yang dipertahankan
                $incomingIds = collect($validated['variants'])->pluck('id')->filter()->toArray();

                // Hapus varian lama yang tidak ada dalam daftar kiriman baru (Syncing)
                $product->variants()->whereNotIn('id', $incomingIds)->delete();

                foreach ($validated['variants'] as $variantData) {
                    $product->variants()->updateOrCreate(
                        ['id' => $variantData['id'] ?? null],
                        [
                            'name' => $variantData['name'],
                            'additional_price' => $variantData['additional_price'],
                            'stock' => $variantData['stock'],
                            'sku' => $variantData['sku'] ?? null,
                        ]
                    );
                }
            });

            return Redirect::back()->with('success', 'Variants synchronized successfully.');

        } catch (\Exception $e) {
            return Redirect::back()->withErrors(['error' => 'Failed to save variants: '.$e->getMessage()]);
        }
    }

    /**
     * Menghapus satu varian secara spesifik.
     */
    public function destroy(ProductVariant $variant)
    {
        $variant->delete();

        return Redirect::back()->with('success', 'Variant removed successfully.');
    }
}
