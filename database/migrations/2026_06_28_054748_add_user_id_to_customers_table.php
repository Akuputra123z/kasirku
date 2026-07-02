<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->index('user_id');
        });

        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropIndex(['customer_id']);
            $table->dropColumn('customer_id');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropIndex(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
