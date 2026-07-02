<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ppob_products', function (Blueprint $table) {
            $table->id();
            $table->string('buyer_sku_code')->unique();
            $table->string('product_name');
            $table->string('category');
            $table->string('brand')->nullable();
            $table->string('type')->default('topup');
            $table->decimal('seller_price', 12, 2)->default(0);
            $table->decimal('buyer_price', 12, 2)->default(0);
            $table->string('markup_type')->default('percentage');
            $table->decimal('markup_value', 12, 2)->default(0);
            $table->boolean('unlimited_stock')->default(true);
            $table->integer('stock')->default(-1);
            $table->boolean('multi')->default(false);
            $table->string('start_cut_off')->nullable();
            $table->string('end_cut_off')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->index('category');
            $table->index('brand');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppob_products');
    }
};
