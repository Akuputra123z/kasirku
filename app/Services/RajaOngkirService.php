<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RajaOngkirService
{
    protected string $apiKey;

    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('rajaongkir.api_key');
        $this->baseUrl = config('rajaongkir.base_url');
    }

    public function getProvinces(): ?array
    {
        $response = Http::withHeaders(['key' => $this->apiKey])
            ->timeout(15)
            ->connectTimeout(5)
            ->get($this->baseUrl.'/destination/province');

        if ($response->successful()) {
            return $response->json('data');
        }

        Log::error('Komerce provinces error', [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function getCities(string $provinceId): ?array
    {
        $response = Http::withHeaders(['key' => $this->apiKey])
            ->timeout(15)
            ->connectTimeout(5)
            ->get($this->baseUrl.'/destination/city/'.$provinceId);

        if ($response->successful()) {
            return $response->json('data');
        }

        Log::error('Komerce cities error', [
            'province_id' => $provinceId,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function getDistricts(string $cityId): ?array
    {
        $response = Http::withHeaders(['key' => $this->apiKey])
            ->timeout(15)
            ->connectTimeout(5)
            ->get($this->baseUrl.'/destination/district/'.$cityId);

        if ($response->successful()) {
            return $response->json('data');
        }

        Log::error('Komerce districts error', [
            'city_id' => $cityId,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }

    public function getCost(string $origin, string $destination, int $weight, string $courier): ?array
    {
        $response = Http::withHeaders(['key' => $this->apiKey])
            ->asForm()
            ->timeout(15)
            ->connectTimeout(5)
            ->post($this->baseUrl.'/calculate/district/domestic-cost', [
                'origin' => $origin,
                'destination' => $destination,
                'weight' => $weight,
                'courier' => $courier,
                'price' => 'lowest',
            ]);

        if ($response->successful()) {
            return $response->json('data');
        }

        Log::error('Komerce cost error', [
            'origin' => $origin,
            'destination' => $destination,
            'weight' => $weight,
            'courier' => $courier,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }
}
