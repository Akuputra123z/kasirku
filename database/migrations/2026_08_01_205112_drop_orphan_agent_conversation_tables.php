<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel yatim tanpa model/kode — dihapus dari arsitektur single database.
     */
    public function up(): void
    {
        Schema::dropIfExists('agent_conversation_messages');
        Schema::dropIfExists('agent_conversations');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('agent_conversations', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });

        Schema::create('agent_conversation_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('agent_conversations')->cascadeOnDelete();
            $table->timestamps();
        });
    }
};
