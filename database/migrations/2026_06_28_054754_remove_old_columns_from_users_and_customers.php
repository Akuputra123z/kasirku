<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            $this->upSqlite();

            return;
        }

        $this->upMysql();
    }

    private function upSqlite(): void
    {
        $this->recreateUsersTableForSqlite();
        $this->recreateCustomersTableForSqlite();
        $this->recreateCustomerAddressesTableForSqlite();
    }

    private function recreateUsersTableForSqlite(): void
    {
        $rows = DB::table('users')->get()->map(fn ($row) => (array) $row)->toArray();

        Schema::drop('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('email_verification_code', 6)->nullable();
            $table->timestamp('email_verification_code_expires_at')->nullable();
            $table->string('password');
            $table->string('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        foreach ($rows as $row) {
            DB::table('users')->insert([
                'id' => $row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'email_verified_at' => $row['email_verified_at'],
                'email_verification_code' => $row['email_verification_code'] ?? null,
                'email_verification_code_expires_at' => $row['email_verification_code_expires_at'] ?? null,
                'password' => $row['password'],
                'two_factor_secret' => $row['two_factor_secret'] ?? null,
                'two_factor_recovery_codes' => $row['two_factor_recovery_codes'] ?? null,
                'two_factor_confirmed_at' => $row['two_factor_confirmed_at'] ?? null,
                'remember_token' => $row['remember_token'] ?? null,
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            ]);
        }
    }

    private function recreateCustomersTableForSqlite(): void
    {
        $rows = DB::table('customers')->get()->map(fn ($row) => (array) $row)->toArray();

        Schema::drop('customers');

        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        foreach ($rows as $row) {
            DB::table('customers')->insert([
                'id' => $row['id'],
                'user_id' => $row['user_id'] ?? null,
                'name' => $row['name'],
                'email' => $row['email'] ?? null,
                'phone' => $row['phone'] ?? null,
                'address' => $row['address'] ?? null,
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'deleted_at' => $row['deleted_at'] ?? null,
            ]);
        }

        DB::statement('CREATE INDEX customers_user_id_index ON customers(user_id)');
    }

    private function recreateCustomerAddressesTableForSqlite(): void
    {
        $rows = DB::table('customer_addresses')->get()->map(fn ($row) => (array) $row)->toArray();

        Schema::drop('customer_addresses');

        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('label')->nullable();
            $table->string('recipient_name');
            $table->string('phone');
            $table->text('address');
            $table->string('city');
            $table->string('province');
            $table->string('postal_code')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        foreach ($rows as $row) {
            DB::table('customer_addresses')->insert([
                'id' => $row['id'],
                'customer_id' => $row['customer_id'] ?? null,
                'label' => $row['label'] ?? null,
                'recipient_name' => $row['recipient_name'],
                'phone' => $row['phone'],
                'address' => $row['address'],
                'city' => $row['city'],
                'province' => $row['province'],
                'postal_code' => $row['postal_code'] ?? null,
                'is_default' => $row['is_default'] ?? false,
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            ]);
        }

        DB::statement('CREATE INDEX customer_addresses_customer_id_index ON customer_addresses(customer_id)');
    }

    private function upMysql(): void
    {
        DB::statement('ALTER TABLE users DROP FOREIGN KEY `1`');
        DB::statement('ALTER TABLE customers DROP FOREIGN KEY customers_tenant_id_foreign');
        DB::statement('ALTER TABLE customer_addresses DROP FOREIGN KEY customer_addresses_user_id_foreign');

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'email']);
            $table->dropColumn(['tenant_id', 'is_marketplace_customer', 'role']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('email');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'email']);
            $table->dropIndex(['tenant_id', 'phone']);
            $table->dropIndex(['tenant_id', 'created_at']);
            $table->dropColumn(['tenant_id', 'loyalty_points']);
        });

        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->integer('loyalty_points')->default(0);
            $table->index(['tenant_id', 'email']);
            $table->index(['tenant_id', 'phone']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->boolean('is_marketplace_customer')->default(false);
            $table->string('role')->nullable();
            $table->dropUnique(['email']);
            $table->unique(['tenant_id', 'email']);
        });
    }
};
