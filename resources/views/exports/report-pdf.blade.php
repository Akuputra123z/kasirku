<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Laporan Keuangan</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #000; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mt-8 { margin-top: 32px; }
        .border-b { border-bottom: 2px solid #000; }
        .border-b-thin { border-bottom: 1px solid #ccc; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 4px 6px; }
        th { border-bottom: 2px solid #000; text-align: left; font-size: 10px; }
        td { border-bottom: 1px solid #ddd; }
        .total-row td { border-top: 2px solid #000; font-weight: bold; }
        .header { font-size: 20px; font-weight: bold; }
        .subheader { font-size: 14px; font-weight: bold; }
        .text-muted { color: #666; font-size: 10px; }
        .mt-2 { margin-top: 8px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
    </style>
</head>
<body>
    <div class="text-center mb-6">
        <div class="header">AMERTA KOMPUTER</div>
        <div class="text-muted">Jl. Diponegoro No.88 Kec.Rembang, Keb.Rembang</div>
        <div class="text-muted">Telp: 0812-3456-7890</div>
        <div class="mt-2 border-b pb-2">
            <div class="subheader">LAPORAN KEUANGAN</div>
            <div class="text-muted">Periode: {{ \Carbon\Carbon::parse($startDate)->isoFormat('D MMM YYYY') }} — {{ \Carbon\Carbon::parse($endDate)->isoFormat('D MMM YYYY') }}</div>
        </div>
    </div>

    <div class="mb-6">
        <div class="subheader border-b mb-2">RINGKASAN</div>
        <table>
            <tr><td>Total Transaksi</td><td class="text-right font-bold">{{ number_format($summary->total_transactions, 0, ',', '.') }} transaksi</td></tr>
            <tr><td>Rata-rata Transaksi</td><td class="text-right font-bold">Rp {{ number_format($summary->avg_transaction, 0, ',', '.') }}</td></tr>
            <tr><td>Total Subtotal</td><td class="text-right">Rp {{ number_format($summary->total_subtotal, 0, ',', '.') }}</td></tr>
            <tr><td>Total Pajak</td><td class="text-right">Rp {{ number_format($summary->total_tax, 0, ',', '.') }}</td></tr>
            <tr><td>Total Diskon</td><td class="text-right">Rp {{ number_format($summary->total_discount, 0, ',', '.') }}</td></tr>
            <tr><td>Total Dibayar</td><td class="text-right">Rp {{ number_format($summary->total_paid, 0, ',', '.') }}</td></tr>
            <tr class="total-row"><td>TOTAL PENDAPATAN</td><td class="text-right">Rp {{ number_format($summary->total_revenue, 0, ',', '.') }}</td></tr>
        </table>
    </div>

    <div class="mb-6">
        <div class="subheader border-b mb-2">LAPORAN HARIAN</div>
        <table>
            <thead>
                <tr><th>Tanggal</th><th class="text-center">Trx</th><th class="text-right">Subtotal</th><th class="text-right">Pajak</th><th class="text-right">Diskon</th><th class="text-right">Pendapatan</th></tr>
            </thead>
            <tbody>
                @foreach($dailyReport as $day)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($day->date)->isoFormat('D MMM YYYY') }}</td>
                    <td class="text-center">{{ $day->transactions_count }}</td>
                    <td class="text-right">Rp {{ number_format($day->subtotal, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($day->tax, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($day->discount, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($day->revenue, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td>TOTAL</td>
                    <td class="text-center">{{ $summary->total_transactions }}</td>
                    <td class="text-right">Rp {{ number_format($summary->total_subtotal, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($summary->total_tax, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($summary->total_discount, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($summary->total_revenue, 0, ',', '.') }}</td>
                </tr>
            </tfoot>
        </table>
    </div>

    <div class="mb-6">
        <div class="subheader border-b mb-2">PRODUK TERLARIS</div>
        <table>
            <thead><tr><th>No</th><th>Nama Produk</th><th class="text-center">Qty</th><th class="text-right">Total</th></tr></thead>
            <tbody>
                @foreach($topProducts as $i => $p)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $p->name }}</td>
                    <td class="text-center">{{ $p->total_qty }}</td>
                    <td class="text-right">Rp {{ number_format($p->total_sales, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="mb-6">
        <div class="subheader border-b mb-2">DETAIL TRANSAKSI</div>
        <table>
            <thead><tr><th>Kode</th><th>Kasir</th><th>Tanggal</th><th class="text-right">Subtotal</th><th class="text-right">Pajak</th><th class="text-right">Diskon</th><th class="text-right">Total</th></tr></thead>
            <tbody>
                @foreach($transactions as $t)
                <tr>
                    <td>{{ $t->transaction_code }}</td>
                    <td>{{ $t->user->name }}</td>
                    <td>{{ \Carbon\Carbon::parse($t->created_at)->isoFormat('D MMM YYYY HH:mm') }}</td>
                    <td class="text-right">Rp {{ number_format($t->subtotal_amount, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($t->tax_amount, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($t->discount_amount, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($t->total_amount, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="text-center mt-8 text-muted">
        <div>Dicetak pada: {{ now()->isoFormat('D MMM YYYY HH:mm') }}</div>
        <div class="font-bold">AMERTA KOMPUTER — Sistem POS</div>
    </div>
</body>
</html>
