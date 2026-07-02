<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('city')->nullable()->after('address');
            $table->string('province')->nullable()->after('city');
            $table->decimal('shipping_cost', 12, 2)->default(0)->after('province');
            $table->text('store_description')->nullable()->after('shipping_cost');
            $table->string('store_banner')->nullable()->after('store_description');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['city', 'province', 'shipping_cost', 'store_description', 'store_banner']);
        });
    }
};
