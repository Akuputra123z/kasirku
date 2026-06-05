<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\Product;
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
}
