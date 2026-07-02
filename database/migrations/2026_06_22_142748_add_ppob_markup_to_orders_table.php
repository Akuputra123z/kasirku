<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('ppob_seller_price', 15, 2)->nullable()->after('ppob_customer_name');
            $table->decimal('ppob_markup', 15, 2)->nullable()->after('ppob_seller_price');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['ppob_seller_price', 'ppob_markup']);
        });
    }
};
