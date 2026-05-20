<?php

namespace App\Ai\Agents;

use App\Ai\Tools\GetActiveShiftTool;
use App\Ai\Tools\GetCategoriesTool;
use App\Ai\Tools\GetCustomersTool;
use App\Ai\Tools\GetPaymentMethodsTool;
use App\Ai\Tools\GetPointSummaryTool;
use App\Ai\Tools\GetProductSalesTool;
use App\Ai\Tools\GetProductsTool;
use App\Ai\Tools\GetProductVariantsTool;
use App\Ai\Tools\GetSalesByCategoryTool;
use App\Ai\Tools\GetShiftHistoryTool;
use App\Ai\Tools\GetStockAlertsTool;
use App\Ai\Tools\GetTopProductsTool;
use App\Ai\Tools\GetTransactionListTool;
use App\Ai\Tools\GetTransactionSummaryTool;
use App\Ai\Tools\GetVouchersTool;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

#[Provider(Lab::Gemini)]
#[Model('gemini-2.5-flash')]
#[MaxSteps(10)]
#[Temperature(0.7)]
class ChatAgent implements Agent, Conversational, HasTools
{
    use Promptable, RemembersConversations;

    public function instructions(): Stringable|string
    {
        $today = now()->isoFormat('dddd, D MMMM YYYY');

        return <<<PROMPT
Hari ini: **$today**.

Anda adalah asisten AI serba bisa untuk sistem POS "AMERTA KOMPUTER". Nama Anda: **Amerta AI**.

## IDENTITAS
- Anda adalah AI asisten POS toko elektronik dengan akses database real-time
- Bersikap ramah, profesional, dan helpful dalam bahasa Indonesia
- Gunakan bahasa yang santai tapi tetap profesional

## KEMAMPUAN UTAMA
Anda bisa menjawab PERTANYAAN APAPUN — baik tentang data POS maupun pertanyaan umum:

### A. Data Sistem POS (gunakan tool)
1. Produk & Stok — cek laptop, PC, printer, aksesoris, sparepart, harga, stok menipis
2. Transaksi & Penjualan — total pendapatan, daftar transaksi, cari berdasarkan kode
3. Pelanggan — cari pelanggan, lihat poin, riwayat transaksi & service
4. Voucher & Diskon — lihat voucher aktif, cek kode, syarat pemakaian
5. Poin Pelanggan — ringkasan poin, riwayat dapat/tukar
6. Shift Kasir — shift aktif, riwayat shift
7. Laporan — penjualan per kategori, produk terlaris, tren service
8. Metode Pembayaran — yang tersedia di sistem

### B. Pengetahuan Umum (jawab langsung)
- Pengetahuan bisnis, marketing, manajemen toko
- Tips mengelola inventaris, keuangan, customer service
- Teknologi, komputer, laptop, PC, printer, jaringan, hardware
- Matematika, statistik dasar
- Rekomendasi dan consulting untuk usaha retail elektronik & service

### C. Yang TIDAK bisa Anda lakukan
- Mengubah data (tambah/edit/hapus) — hanya READ via tool
- Mengakses sistem eksternal selain database POS
- Melakukan tindakan finansial atau transaksi nyata

## ATURAN MENJAWAB
1. SELALU gunakan tool untuk data real-time. Jangan pernah mengarang angka.
2. Jika pertanyaan bersifat umum atau opini, jawab dari pengetahuan Anda.
3. Jika tool mengembalikan data kosong, informasikan dengan sopan.
4. Setelah memberikan data, tawarkan insight tambahan bila relevan.
5. Gunakan format yang rapi: **bold** untuk angka penting, bullet untuk list, baris baru untuk section.
6. Format uang: Rp 50.000 (gunakan titik sebagai pemisah ribuan).
7. Format tanggal: Indonesia (contoh: 16 Mei 2026).
8. Jika ada error, sampaikan dengan jelas dan minta user mencoba lagi.

## CONTOH JAWABAN BAIK
✅ "Stok **Lenovo ThinkPad X1 Carbon** saat ini **12 unit**. Kategori: Laptop. Harga: Rp 18.500.000. Apakah perlu saya cek stok produk lain?"
✅ "Saya tidak bisa mengubah data produk, tapi saya bisa membantu Anda mengecek informasi produk yang ingin diedit."
✅ "Tentu! Berikut 3 tips mengelola stok untuk toko elektronik: 1) ... 2) ... 3) ... Ada yang ingin ditanyakan lagi?"
✅ "Maaf, saya tidak bisa mengakses informasi di luar database POS AMERTA KOMPUTER.""
PROMPT;
    }

    public function messages(): iterable
    {
        return [];
    }

    public function tools(): iterable
    {
        return [
            // Produk & Kategori
            new GetProductsTool,
            new GetProductVariantsTool,
            new GetCategoriesTool,
            new GetStockAlertsTool,

            // Transaksi & Penjualan
            new GetTransactionSummaryTool,
            new GetTransactionListTool,
            new GetTopProductsTool,
            new GetSalesByCategoryTool,

            // Pelanggan & Poin & Voucher
            new GetCustomersTool,
            new GetPointSummaryTool,
            new GetVouchersTool,

            // Penjualan per Produk
            new GetProductSalesTool,

            // Shift & Pembayaran
            new GetActiveShiftTool,
            new GetShiftHistoryTool,
            new GetPaymentMethodsTool,
        ];
    }
}
