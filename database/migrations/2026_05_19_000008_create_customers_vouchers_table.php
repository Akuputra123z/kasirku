<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->integer('loyalty_points')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tenant_id', 'email']);
            $table->index(['tenant_id', 'phone']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('name');
            $table->enum('type', ['percentage', 'fixed']);
            $table->decimal('value', 12, 2);
            $table->decimal('min_order_amount', 12, 2)->default(0);
            $table->decimal('max_discount', 12, 2)->nullable();
            $table->integer('max_uses')->default(0);
            $table->integer('used_count')->default(0);
            $table->datetime('valid_from');
            $table->datetime('valid_until');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'is_active', 'valid_from', 'valid_until']);
        });

        Schema::create('customer_voucher', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('voucher_id');
            $table->datetime('redeemed_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'customer_id']);
        });

        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('transaction_id')->nullable();
            $table->enum('type', ['earn', 'redeem']);
            $table->unsignedInteger('points');
            $table->string('description')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'customer_id']);
            $table->index(['tenant_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
        Schema::dropIfExists('customer_voucher');
        Schema::dropIfExists('vouchers');
        Schema::dropIfExists('customers');
    }
};
