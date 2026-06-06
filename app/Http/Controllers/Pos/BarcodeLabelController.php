<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Milon\Barcode\DNS1D;

class BarcodeLabelController extends Controller
{
    public function __invoke(Product $product): Response
    {
        $barcode = $product->barcode;

        $barcodeBase64 = null;
        if ($barcode) {
            $barcodeBase64 = (new DNS1D)->getBarcodePNG($barcode, 'C128', 2, 60);
        }

        return Inertia::render('products/barcode-label', [
            'product' => $product->load('category'),
            'barcode' => $barcode,
            'barcodeBase64' => $barcodeBase64,
        ]);
    }

    public function bulk(Request $request): Response
    {
        $request->validate([
            'ids' => 'required',
        ]);

        $ids = is_array($request->ids)
            ? $request->ids
            : explode(',', $request->ids);

        $ids = array_map('intval', array_filter($ids, fn ($v) => $v !== ''));

        $products = Product::whereIn('id', $ids)
            ->whereNotNull('barcode')
            ->with('category')
            ->get();

        $dns = new DNS1D;
        $labels = $products->map(fn ($product) => [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'category' => $product->category,
            ],
            'barcode' => $product->barcode,
            'barcodeBase64' => $dns->getBarcodePNG($product->barcode, 'C128', 2, 60),
        ]);

        return Inertia::render('products/barcode-labels', [
            'labels' => $labels,
            'total' => $products->count(),
            'skipped' => count($ids) - $products->count(),
        ]);
    }
}
