<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('shipping_cost', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('payment_status')->default('unpaid');
            $table->string('payment_method')->nullable();
            $table->text('shipping_address');
            $table->string('recipient_name');
            $table->string('recipient_phone');
            $table->text('notes')->nullable();
            $table->string('midtrans_transaction_id')->nullable();
            $table->string('midtrans_order_id')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
