<?php

namespace App\Ai\Tools;

use App\Models\PaymentMethod;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetPaymentMethodsTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil daftar metode pembayaran yang tersedia. Bisa filter berdasarkan tipe (Cash, E-Wallet, Bank) atau status aktif.';
    }

    public function handle(Request $request): Stringable|string
    {
        $query = PaymentMethod::query();

        if (! empty($request['type'])) {
            $query->where('type', $request['type']);
        }

        if (isset($request['is_active'])) {
            $query->where('is_active', filter_var($request['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        $methods = $query->get()->map(fn ($m) => [
            'id' => $m->id,
            'nama' => $m->name,
            'tipe' => $m->type,
            'status' => $m->is_active ? 'Aktif' : 'Nonaktif',
        ]);

        if ($methods->isEmpty()) {
            return 'Tidak ada metode pembayaran ditemukan.';
        }

        return json_encode($methods->toArray(), JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'type' => $schema->string()->nullable()->enum(['Cash', 'E-Wallet', 'Bank'])->description('Filter berdasarkan tipe pembayaran'),
            'is_active' => $schema->boolean()->nullable()->description('Filter berdasarkan status aktif (true/false)'),
        ];
    }
}
