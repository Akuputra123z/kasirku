<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('po_number');
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->date('order_date');
            $table->date('received_date')->nullable();
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'po_number']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'order_date']);
            $table->index(['tenant_id', 'supplier_id']);
        });

        Schema::create('purchase_order_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity');
            $table->integer('received_quantity')->default(0);
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
            $table->index(['tenant_id', 'purchase_order_id']);
            $table->index(['tenant_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_details');
        Schema::dropIfExists('purchase_orders');
    }
};
