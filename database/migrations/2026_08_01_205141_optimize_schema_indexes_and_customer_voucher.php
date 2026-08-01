<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Optimasi skema: perbaikan pivot customer_voucher + indeks komposit
     * untuk query yang sering berjalan (reports, dashboard, marketplace).
     */
    public function up(): void
    {
        // 1. Backfill tenant_id di customer_voucher dari relasi voucher/customer
        $orphans = DB::table('customer_voucher')
            ->whereNull('tenant_id')
            ->count();

        if ($orphans > 0) {
            DB::statement('
                UPDATE customer_voucher cv
                JOIN vouchers v ON v.id = cv.voucher_id
                SET cv.tenant_id = v.tenant_id
                WHERE cv.tenant_id IS NULL
            ');

            DB::statement('
                UPDATE customer_voucher cv
                JOIN store_customer sc ON sc.customer_id = cv.customer_id
                SET cv.tenant_id = sc.tenant_id
                WHERE cv.tenant_id IS NULL
            ');
        }

        // 2. Indeks komposit yang hilang (query tenant-scoped)
        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['tenant_id', 'customer_id'], 'transactions_tenant_customer_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['tenant_id', 'visible_online', 'status'], 'products_tenant_visible_status_index');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['tenant_id', 'type', 'status', 'created_at'], 'orders_tenant_type_status_created_index');
        });

        Schema::table('transaction_details', function (Blueprint $table) {
            $table->index(['tenant_id', 'created_at'], 'transaction_details_tenant_created_index');
        });

        Schema::table('customer_voucher', function (Blueprint $table) {
            $table->index(['tenant_id', 'customer_id'], 'customer_voucher_tenant_customer_index');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->index(['tenant_id', 'created_at'], 'stock_movements_tenant_created_index');
        });

        // 3. FULLTEXT untuk pencarian produk & pesanan (MySQL only — SQLite tidak mendukung)
        if (DB::connection()->getDriverName() === 'mysql') {
            Schema::table('products', function (Blueprint $table) {
                $table->fullText(['name', 'barcode'], 'products_name_barcode_fulltext');
            });

            Schema::table('orders', function (Blueprint $table) {
                $table->fullText(['order_number'], 'orders_order_number_fulltext');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('transactions_tenant_customer_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_tenant_visible_status_index');
            if (DB::connection()->getDriverName() === 'mysql') {
                $table->dropIndex('products_name_barcode_fulltext');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_tenant_type_status_created_index');
            if (DB::connection()->getDriverName() === 'mysql') {
                $table->dropIndex('orders_order_number_fulltext');
            }
        });

        Schema::table('transaction_details', function (Blueprint $table) {
            $table->dropIndex('transaction_details_tenant_created_index');
        });

        Schema::table('customer_voucher', function (Blueprint $table) {
            $table->dropIndex('customer_voucher_tenant_customer_index');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('stock_movements_tenant_created_index');
        });
    }
};
