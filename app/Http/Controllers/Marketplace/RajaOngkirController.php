<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Services\RajaOngkirService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RajaOngkirController extends Controller
{
    public function provinces(RajaOngkirService $rajaongkir): JsonResponse
    {
        $provinces = $rajaongkir->getProvinces();

        if ($provinces === null) {
            return response()->json(['error' => 'Gagal memuat provinsi'], 500);
        }

        return response()->json($provinces);
    }

    public function cities(string $provinceId, RajaOngkirService $rajaongkir): JsonResponse
    {
        $cities = $rajaongkir->getCities($provinceId);

        if ($cities === null) {
            return response()->json(['error' => 'Gagal memuat kota/distrik'], 500);
        }

        return response()->json($cities);
    }

    public function districts(string $cityId, RajaOngkirService $rajaongkir): JsonResponse
    {
        $districts = $rajaongkir->getDistricts($cityId);

        if ($districts === null) {
            return response()->json(['error' => 'Gagal memuat kecamatan'], 500);
        }

        return response()->json($districts);
    }

    public function cost(Request $request, RajaOngkirService $rajaongkir): JsonResponse
    {
        $validated = $request->validate([
            'origin' => ['required', 'string'],
            'destination' => ['required', 'string'],
            'weight' => ['required', 'integer', 'min:1'],
            'courier' => ['required', 'string'],
        ]);

        $result = $rajaongkir->getCost(
            $validated['origin'],
            $validated['destination'],
            $validated['weight'],
            $validated['courier'],
        );

        if ($result === null) {
            return response()->json(['error' => 'Gagal menghitung ongkos kirim'], 500);
        }

        return response()->json($result);
    }
}
