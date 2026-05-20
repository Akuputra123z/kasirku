<?php

namespace App\Ai\Tools;

use App\Models\Voucher;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetVouchersTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil daftar voucher diskon yang tersedia. Bisa filter berdasarkan status aktif, kode, cari nama, atau tampilkan semua.';
    }

    public function handle(Request $request): Stringable|string
    {
        $query = Voucher::query();

        if (! empty($request['code'])) {
            $query->where('code', 'like', '%'.$request['code'].'%');
        }

        if (! empty($request['search'])) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', '%'.$request['search'].'%')
                    ->orWhere('name', 'like', '%'.$request['search'].'%');
            });
        }

        if (isset($request['is_active'])) {
            $query->where('is_active', filter_var($request['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        $vouchers = $query->latest()->limit(20)->get()->map(fn ($v) => [
            'id' => $v->id,
            'kode' => $v->code,
            'nama' => $v->name,
            'tipe' => $v->type === 'percentage' ? 'Persen' : 'Nominal',
            'nilai' => $v->type === 'percentage' ? $v->value.'%' : 'Rp '.number_format($v->value, 0, ',', '.'),
            'min_order' => 'Rp '.number_format($v->min_order_amount, 0, ',', '.'),
            'max_diskon' => $v->max_discount ? 'Rp '.number_format($v->max_discount, 0, ',', '.') : 'Tidak terbatas',
            'pemakaian' => $v->max_uses ? "{$v->used_count}/{$v->max_uses}" : (string) $v->used_count,
            'berlaku_dari' => $v->valid_from?->format('d M Y') ?? '—',
            'berlaku_sampai' => $v->valid_until?->format('d M Y') ?? '—',
            'status' => $v->is_active ? 'Aktif' : 'Nonaktif',
        ]);

        if ($vouchers->isEmpty()) {
            return 'Tidak ada voucher ditemukan.';
        }

        return json_encode($vouchers->toArray(), JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'code' => $schema->string()->nullable()->description('Cari berdasarkan kode voucher'),
            'search' => $schema->string()->nullable()->description('Cari berdasarkan nama atau kode voucher'),
            'is_active' => $schema->boolean()->nullable()->description('Filter berdasarkan status aktif (true/false)'),
        ];
    }
}
