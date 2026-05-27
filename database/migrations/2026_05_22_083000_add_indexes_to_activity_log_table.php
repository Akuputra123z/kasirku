<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_log', function (Blueprint $table) {
            $table->index('created_at', 'idx_activity_log_created_at');
            $table->index(['event', 'created_at'], 'idx_activity_log_event_created');
        });
    }

    public function down(): void
    {
        Schema::table('activity_log', function (Blueprint $table) {
            $table->dropIndex('idx_activity_log_created_at');
            $table->dropIndex('idx_activity_log_event_created');
        });
    }
};
