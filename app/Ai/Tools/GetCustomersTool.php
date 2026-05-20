<?php

namespace App\Ai\Tools;

use App\Models\Customer;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetCustomersTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil daftar pelanggan. Bisa cari berdasarkan nama, email, atau nomor telepon. Juga menampilkan total poin dan jumlah transaksi pelanggan.';
    }

    public function handle(Request $request): Stringable|string
    {
        $query = Customer::query()->withCount('transactions');

        if (! empty($request['search'])) {
            $search = $request['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $customers = $query->latest()->limit(20)->get()->map(fn ($c) => [
            'id' => $c->id,
            'nama' => $c->name,
            'email' => $c->email ?? '-',
            'telepon' => $c->phone ?? '-',
            'poin' => $c->loyalty_points,
            'total_transaksi' => $c->transactions_count,
            'terdaftar_sejak' => $c->created_at->format('d M Y'),
        ]);

        if ($customers->isEmpty()) {
            return 'Tidak ada pelanggan ditemukan.';
        }

        return json_encode($customers->toArray(), JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'search' => $schema->string()->nullable()->description('Cari pelanggan berdasarkan nama, email, atau telepon'),
        ];
    }
}
