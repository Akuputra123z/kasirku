<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menandai kapan stok pesanan marketplace yang gagal/tidak dibayar
     * dikembalikan — mencegah restore stok ganda (idempotency guard).
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('stock_restored_at')->nullable()->after('digiflazz_sn');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('stock_restored_at');
        });
    }
};
