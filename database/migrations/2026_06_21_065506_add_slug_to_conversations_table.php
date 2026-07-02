<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('user_id');
        });

        Conversation::chunk(50, function ($conversations) {
            foreach ($conversations as $conversation) {
                $user = User::find($conversation->user_id);
                $name = $user?->name ?? "user-{$conversation->user_id}";
                $conversation->update(['slug' => Str::slug($name).'-'.$conversation->id]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
