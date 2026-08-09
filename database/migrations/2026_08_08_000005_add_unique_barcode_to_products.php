<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Barcode harus unik per tenant: scanner tidak boleh menemukan dua produk
     * berbeda untuk kode yang sama. Duplikat lama dinonaktifkan (barcode
     * dikosongkan, produk tetap ada) sebelum index unik dibuat.
     */
    public function up(): void
    {
        $duplicates = DB::table('products')
            ->select('tenant_id', 'barcode')
            ->whereNotNull('barcode')
            ->groupBy('tenant_id', 'barcode')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            $keep = DB::table('products')
                ->where('tenant_id', $dup->tenant_id)
                ->where('barcode', $dup->barcode)
                ->orderBy('id')
                ->value('id');

            DB::table('products')
                ->where('tenant_id', $dup->tenant_id)
                ->where('barcode', $dup->barcode)
                ->where('id', '!=', $keep)
                ->update(['barcode' => null]);
        }

        Schema::table('products', function (Blueprint $table) {
            $table->unique(['tenant_id', 'barcode'], 'products_tenant_barcode_unique');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_tenant_barcode_unique');
        });
    }
};
