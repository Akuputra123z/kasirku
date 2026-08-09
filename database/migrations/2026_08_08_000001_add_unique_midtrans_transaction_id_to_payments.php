<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Idempotency guard untuk webhook Midtrans:
     * Midtrans me-retry notifikasi yang sama berkali-kali, jadi setiap
     * transaksi hanya boleh tercatat satu kali.
     */
    public function up(): void
    {
        $duplicates = DB::table('payments')
            ->select('midtrans_transaction_id')
            ->whereNotNull('midtrans_transaction_id')
            ->groupBy('midtrans_transaction_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('midtrans_transaction_id');

        foreach ($duplicates as $transactionId) {
            $keep = DB::table('payments')
                ->where('midtrans_transaction_id', $transactionId)
                ->orderBy('id')
                ->value('id');

            DB::table('payments')
                ->where('midtrans_transaction_id', $transactionId)
                ->where('id', '!=', $keep)
                ->delete();
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->unique('midtrans_transaction_id', 'payments_midtrans_transaction_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique('payments_midtrans_transaction_id_unique');
        });
    }
};
