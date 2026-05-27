<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\PaymentMethod;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class RegisterStoreController extends Controller
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __invoke(Request $request)
    {
        try {
            $validated = Validator::make($request->all(), [
                ...$this->profileRules(),
                'password' => $this->passwordRules(),
                'google_registered' => ['nullable', 'boolean'],
            ])->validate();

            $isGoogleRegistered = $validated['google_registered'] ?? false;

            $user = null;

            DB::transaction(function () use ($validated, $isGoogleRegistered, &$user) {
                $slug = 'store-'.strtolower(bin2hex(random_bytes(4)));

                $tenant = Tenant::create([
                    'name' => 'Toko '.$validated['name'],
                    'slug' => $slug,
                ]);

                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'tenant_id' => $tenant->id,
                    'email_verified_at' => $isGoogleRegistered ? now() : null,
                ]);

                (new RoleAndPermissionSeeder)->run($tenant->id);

                foreach ([
                    ['Cash', 'Cash'], ['QRIS', 'E-Wallet'], ['GoPay', 'E-Wallet'],
                    ['ShopeePay', 'E-Wallet'], ['BCA', 'Bank'], ['Mandiri', 'Bank'], ['BRI', 'Bank'],
                ] as [$name, $type]) {
                    PaymentMethod::create(['name' => $name, 'type' => $type, 'is_active' => true, 'tenant_id' => $tenant->id]);
                }

                $user->assignRole('admin');

                $user->sendEmailVerificationNotification();
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Toko berhasil dibuat! Silakan login.',
                'redirect' => '/login',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'errors' => ['form' => 'Terjadi kesalahan: '.$e->getMessage()],
            ], 500);
        }
    }
}
