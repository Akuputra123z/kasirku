<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_customer', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->integer('loyalty_points')->default(0);
            $table->decimal('total_spent', 15, 2)->default(0);
            $table->timestamp('last_visit_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['customer_id', 'tenant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_customer');
    }
};
