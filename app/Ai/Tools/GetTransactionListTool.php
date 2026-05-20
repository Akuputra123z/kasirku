<?php

namespace App\Ai\Tools;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetTransactionListTool implements Tool
{
    public function description(): Stringable|string
    {
        return 'Mengambil daftar transaksi penjualan. Bisa filter berdasarkan tanggal, metode pembayaran, atau cari berdasarkan kode transaksi. Menampilkan detail item dan produk yang dibeli.';
    }

    public function handle(Request $request): Stringable|string
    {
        $query = Transaction::with(['details.product', 'paymentMethod', 'user']);

        if (! empty($request['date'])) {
            $query->whereDate('created_at', Carbon::parse($request['date']));
        }

        if (! empty($request['start_date']) && ! empty($request['end_date'])) {
            $query->whereBetween('created_at', [
                Carbon::parse($request['start_date'])->startOfDay(),
                Carbon::parse($request['end_date'])->endOfDay(),
            ]);
        }

        if (! empty($request['payment_method_id'])) {
            $query->where('payment_method_id', $request['payment_method_id']);
        }

        if (! empty($request['search'])) {
            $query->where('transaction_code', 'like', '%'.$request['search'].'%');
        }

        if (! empty($request['status'])) {
            $query->where('status', $request['status']);
        }

        $transactions = $query->latest()->limit(20)->get()->map(fn ($t) => [
            'kode' => $t->transaction_code,
            'tanggal' => $t->created_at->format('d M Y H:i'),
            'kasir' => $t->user?->name ?? '-',
            'metode_pembayaran' => $t->paymentMethod?->name ?? '-',
            'subtotal' => 'Rp '.number_format($t->subtotal_amount, 0, ',', '.'),
            'diskon' => 'Rp '.number_format($t->discount_amount, 0, ',', '.'),
            'total' => 'Rp '.number_format($t->total_amount, 0, ',', '.'),
            'dibayar' => 'Rp '.number_format($t->paid_amount, 0, ',', '.'),
            'kembalian' => 'Rp '.number_format($t->change_amount, 0, ',', '.'),
            'tipe' => $t->order_type,
            'status' => $t->status,
            'item' => $t->details->map(fn ($d) => [
                'produk' => $d->product?->name ?? '-',
                'varian' => $d->variant_name ?? '-',
                'ekstra' => $d->extras_selected ?? '-',
                'qty' => $d->quantity,
                'harga' => 'Rp '.number_format($d->price, 0, ',', '.'),
                'subtotal' => 'Rp '.number_format($d->subtotal, 0, ',', '.'),
            ]),
        ]);

        if ($transactions->isEmpty()) {
            return 'Tidak ada transaksi ditemukan.';
        }

        return json_encode($transactions->toArray(), JSON_UNESCAPED_UNICODE);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'date' => $schema->string()->nullable()->description('Filter berdasarkan tanggal (format: YYYY-MM-DD)'),
            'start_date' => $schema->string()->nullable()->description('Filter tanggal mulai (format: YYYY-MM-DD)'),
            'end_date' => $schema->string()->nullable()->description('Filter tanggal akhir (format: YYYY-MM-DD)'),
            'payment_method_id' => $schema->integer()->nullable()->description('Filter berdasarkan ID metode pembayaran'),
            'search' => $schema->string()->nullable()->description('Cari berdasarkan kode transaksi'),
            'status' => $schema->string()->nullable()->enum(['completed', 'pending', 'cancelled'])->description('Filter status transaksi'),
        ];
    }
}
