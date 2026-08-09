<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Satu transaksi hanya boleh menghasilkan satu catatan earn dan satu
     * redeem per pelanggan — mencegah double-credit poin akibat submit ganda.
     */
    public function up(): void
    {
        $duplicates = DB::table('point_transactions')
            ->select('tenant_id', 'transaction_id', 'type')
            ->whereNotNull('transaction_id')
            ->groupBy('tenant_id', 'transaction_id', 'type')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            $keep = DB::table('point_transactions')
                ->where('tenant_id', $dup->tenant_id)
                ->where('transaction_id', $dup->transaction_id)
                ->where('type', $dup->type)
                ->orderBy('id')
                ->value('id');

            DB::table('point_transactions')
                ->where('tenant_id', $dup->tenant_id)
                ->where('transaction_id', $dup->transaction_id)
                ->where('type', $dup->type)
                ->where('id', '!=', $keep)
                ->delete();
        }

        Schema::table('point_transactions', function (Blueprint $table) {
            $table->unique(
                ['tenant_id', 'transaction_id', 'type'],
                'point_transactions_tenant_trx_type_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::table('point_transactions', function (Blueprint $table) {
            $table->dropUnique('point_transactions_tenant_trx_type_unique');
        });
    }
};
