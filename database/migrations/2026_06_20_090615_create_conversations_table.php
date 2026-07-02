<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('subject')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'tenant_id']);
            $table->index('tenant_id');
            $table->index('last_message_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
