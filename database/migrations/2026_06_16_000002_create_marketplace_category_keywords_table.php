<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketplace_category_keywords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marketplace_category_id')->constrained()->cascadeOnDelete();
            $table->string('keyword');
            $table->timestamps();

            $table->unique(['marketplace_category_id', 'keyword'], 'mp_cat_kw_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketplace_category_keywords');
    }
};
