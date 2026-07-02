<?php

use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // ─── 1. Add slug to products ────────────────────────────────────────
        Schema::table('products', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
        });

        foreach (Product::all() as $product) {
            $slug = Str::slug($product->name);
            $original = $slug;
            $i = 1;
            while (Product::where('tenant_id', $product->tenant_id)->where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                $slug = $original.'-'.$i++;
            }
            $product->update(['slug' => $slug]);
        }

        Schema::table('products', function (Blueprint $table) {
            $table->unique(['tenant_id', 'slug']);
        });

        // ─── 2. Update tenant slugs to name-based ──────────────────────────
        foreach (Tenant::all() as $tenant) {
            $slug = Str::slug($tenant->name);
            $original = $slug;
            $i = 1;
            while (Tenant::where('slug', $slug)->where('id', '!=', $tenant->id)->exists()) {
                $slug = $original.'-'.$i++;
            }
            if ($tenant->slug !== $slug) {
                $tenant->update(['slug' => $slug]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'slug']);
            $table->dropColumn('slug');
        });
    }
};
