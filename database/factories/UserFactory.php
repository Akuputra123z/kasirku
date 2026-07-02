<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function marketplaceCustomer(): static
    {
        return $this->afterCreating(function (User $user) {
            $customer = Customer::factory()->create([
                'user_id' => $user->id,
            ]);

            if ($user->email) {
                $customer->update(['email' => $user->email]);
            }
        });
    }

    public function storeOwner(?Tenant $tenant = null): static
    {
        return $this->afterCreating(function (User $user) use ($tenant) {
            $tenant = $tenant ?? Tenant::factory()->create();

            TenantUser::create([
                'user_id' => $user->id,
                'tenant_id' => $tenant->id,
                'role' => 'owner',
            ]);
        });
    }
}
