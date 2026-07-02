<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('package'); // monthly / yearly
            $table->decimal('amount', 15, 2);
            $table->string('midtrans_order_id')->unique();
            $table->string('midtrans_transaction_id')->nullable();
            $table->string('status'); // pending / paid / expired / cancelled
            $table->timestamp('started_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
