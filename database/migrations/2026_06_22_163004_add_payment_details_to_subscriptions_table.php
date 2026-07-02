<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('midtrans_transaction_id');
            $table->text('payment_payload')->nullable()->after('payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payment_payload']);
        });
    }
};
