<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('type')->default('marketplace')->after('id');
            $table->string('customer_phone')->nullable()->after('recipient_phone');
            $table->string('digiflazz_ref_id')->nullable()->after('midtrans_redirect_url');
            $table->string('digiflazz_status')->nullable()->after('digiflazz_ref_id');
            $table->string('digiflazz_message')->nullable()->after('digiflazz_status');
            $table->string('digiflazz_sn')->nullable()->after('digiflazz_message');
            $table->string('ppob_category')->nullable()->after('digiflazz_sn');
            $table->string('ppob_brand')->nullable()->after('ppob_category');
            $table->string('ppob_buyer_sku_code')->nullable()->after('ppob_brand');

            $table->index('type');
            $table->index('digiflazz_ref_id');
            $table->index('digiflazz_status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'customer_phone',
                'digiflazz_ref_id',
                'digiflazz_status',
                'digiflazz_message',
                'digiflazz_sn',
                'ppob_category',
                'ppob_brand',
                'ppob_buyer_sku_code',
            ]);
        });
    }
};
