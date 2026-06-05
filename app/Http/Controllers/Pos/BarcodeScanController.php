<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Services\BarcodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class BarcodeScanController extends Controller
{
    public function __invoke(Request $request, string $barcode, BarcodeService $service): JsonResponse
    {
        if (strlen($barcode) < 5) {
            return response()->json([
                'message' => 'Barcode terlalu pendek',
            ], 422);
        }

        $executed = RateLimiter::attempt(
            'barcode:'.tenant_id().':'.$barcode,
            30,
            function () {},
            1,
        );

        if (! $executed) {
            return response()->json([
                'message' => 'Terlalu banyak permintaan, silakan coba lagi',
            ], 429);
        }

        $product = $service->lookup($barcode);

        if (! $product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'product' => $product,
        ]);
    }
}
