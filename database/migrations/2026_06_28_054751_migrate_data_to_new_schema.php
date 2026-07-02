<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        // 1. Migrate staff/owner users to tenant_users
        DB::table('users')
            ->whereNotNull('tenant_id')
            ->orderBy('id')
            ->each(function ($user) use ($now) {
                DB::table('tenant_users')->insert([
                    'user_id' => $user->id,
                    'tenant_id' => $user->tenant_id,
                    'role' => $user->role ?? 'staff',
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });

        // 2. Create customer records for marketplace users (is_marketplace_customer = true)
        DB::table('users')
            ->where('is_marketplace_customer', true)
            ->orderBy('id')
            ->each(function ($user) use ($now) {
                $customerId = DB::table('customers')->insertGetId([
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => null,
                    'address' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                // 3. Link existing customer_addresses to the new customer
                DB::table('customer_addresses')
                    ->where('user_id', $user->id)
                    ->update(['customer_id' => $customerId]);
            });

        // 4. Migrate POS customer loyalty data to store_customer pivot
        DB::table('customers')
            ->whereNull('user_id')
            ->orderBy('id')
            ->each(function ($customer) use ($now) {
                DB::table('store_customer')->insert([
                    'customer_id' => $customer->id,
                    'tenant_id' => $customer->tenant_id,
                    'loyalty_points' => $customer->loyalty_points ?? 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });

        // 5. For marketplace customers that also have tenant_id (dual-role),
        //    also create store_customer entry
        DB::table('customers')
            ->whereNotNull('user_id')
            ->whereIn('user_id', function ($q) {
                $q->select('id')->from('users')->whereNotNull('tenant_id');
            })
            ->orderBy('id')
            ->each(function ($customer) {
                $user = DB::table('users')->find($customer->user_id);
                if ($user && $user->tenant_id) {
                    $existing = DB::table('store_customer')
                        ->where('customer_id', $customer->id)
                        ->where('tenant_id', $user->tenant_id)
                        ->exists();

                    if (! $existing) {
                        DB::table('store_customer')->insert([
                            'customer_id' => $customer->id,
                            'tenant_id' => $user->tenant_id,
                            'loyalty_points' => 0,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            });
    }

    public function down(): void
    {
        DB::table('store_customer')->truncate();

        DB::table('customer_addresses')
            ->whereNotNull('customer_id')
            ->update(['customer_id' => null]);

        DB::table('customers')
            ->whereNotNull('user_id')
            ->delete();

        DB::table('tenant_users')->truncate();
    }
};
