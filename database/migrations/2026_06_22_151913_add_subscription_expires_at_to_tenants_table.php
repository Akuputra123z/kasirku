<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->timestamp('subscription_expires_at')->nullable()->after('subscription_tier');
            $table->index('subscription_tier');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex(['subscription_tier']);
            $table->dropColumn('subscription_expires_at');
        });
    }
};
