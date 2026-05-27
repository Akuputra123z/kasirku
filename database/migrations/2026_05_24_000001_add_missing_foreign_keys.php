<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('serial_numbers', function (Blueprint $table) {
            $table->foreign('transaction_detail_id')
                ->references('id')
                ->on('transaction_details')
                ->onDelete('set null');
        });

        Schema::table('customer_voucher', function (Blueprint $table) {
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->cascadeOnDelete();

            $table->foreign('voucher_id')
                ->references('id')
                ->on('vouchers')
                ->cascadeOnDelete();
        });

        Schema::table('point_transactions', function (Blueprint $table) {
            $table->foreign('transaction_id')
                ->references('id')
                ->on('transactions')
                ->onDelete('set null');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreign('payment_method_id')
                ->references('id')
                ->on('payment_methods')
                ->onDelete('set null');

            $table->foreign('shift_id')
                ->references('id')
                ->on('shifts')
                ->onDelete('set null');

            $table->foreign('voucher_id')
                ->references('id')
                ->on('vouchers')
                ->onDelete('set null');
        });

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Permission::firstOrCreate([
            'name' => 'manage-customers',
            'guard_name' => 'web',
        ]);

        $adminRoles = Role::where('name', 'admin')->get();
        foreach ($adminRoles as $role) {
            $role->givePermissionTo('manage-customers');
        }
    }

    public function down(): void
    {
        Schema::table('serial_numbers', function (Blueprint $table) {
            $table->dropForeign(['transaction_detail_id']);
        });

        Schema::table('customer_voucher', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['voucher_id']);
        });

        Schema::table('point_transactions', function (Blueprint $table) {
            $table->dropForeign(['transaction_id']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['payment_method_id']);
            $table->dropForeign(['shift_id']);
            $table->dropForeign(['voucher_id']);
        });
    }
};
