<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('serial_numbers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('serial_number');
            $table->string('status')->default('available'); // available, sold, service, claimed
            $table->unsignedBigInteger('transaction_detail_id')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->date('purchased_at')->nullable();
            $table->date('sold_at')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'serial_number']);
            $table->index(['tenant_id', 'product_id']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'type']);
        });

        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->datetime('start_time');
            $table->datetime('end_time')->nullable();
            $table->decimal('starting_cash', 12, 2);
            $table->decimal('expected_cash', 12, 2)->nullable();
            $table->decimal('actual_cash', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'user_id']);
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('serial_numbers');
    }
};
