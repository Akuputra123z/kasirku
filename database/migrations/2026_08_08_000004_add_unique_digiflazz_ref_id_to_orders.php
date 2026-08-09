<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Satu ref_id Digiflazz hanya boleh muncul satu kali — mencegah
     * transaksi top-up ganda yang menghasilkan ref_id berbeda untuk
     * order yang sama (double-credit ke pelanggan).
     */
    public function up(): void
    {
        $duplicates = DB::table('orders')
            ->select('digiflazz_ref_id')
            ->whereNotNull('digiflazz_ref_id')
            ->groupBy('digiflazz_ref_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('digiflazz_ref_id');

        foreach ($duplicates as $refId) {
            $keep = DB::table('orders')
                ->where('digiflazz_ref_id', $refId)
                ->orderBy('id')
                ->value('id');

            DB::table('orders')
                ->where('digiflazz_ref_id', $refId)
                ->where('id', '!=', $keep)
                ->update(['digiflazz_ref_id' => null]);
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->unique('digiflazz_ref_id', 'orders_digiflazz_ref_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique('orders_digiflazz_ref_id_unique');
        });
    }
};
