<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\PaymentMethod;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\BillingService;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
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
                $storeName = $validated['name'];
                $slug = Str::slug($storeName);
                $original = $slug;
                $i = 1;
                while (Tenant::where('slug', $slug)->exists()) {
                    $slug = $original.'-'.$i++;
                }

                $tenant = Tenant::create([
                    'name' => $storeName,
                    'slug' => $slug,
                ]);

                $existingUser = User::where('email', $validated['email'])->first();

                if ($existingUser) {
                    $user = $existingUser;
                    TenantUser::create([
                        'user_id' => $user->id,
                        'tenant_id' => $tenant->id,
                        'role' => 'owner',
                    ]);
                } else {
                    $user = User::create([
                        'name' => $validated['name'],
                        'email' => $validated['email'],
                        'password' => Hash::make($validated['password']),
                        'email_verified_at' => $isGoogleRegistered ? now() : null,
                    ]);

                    TenantUser::create([
                        'user_id' => $user->id,
                        'tenant_id' => $tenant->id,
                        'role' => 'owner',
                    ]);
                }

                (new RoleAndPermissionSeeder)->run($tenant->id);

                foreach ([
                    ['Cash', 'Cash'], ['QRIS', 'E-Wallet'], ['GoPay', 'E-Wallet'],
                    ['ShopeePay', 'E-Wallet'], ['BCA', 'Bank'], ['Mandiri', 'Bank'], ['BRI', 'Bank'],
                ] as [$name, $type]) {
                    PaymentMethod::create(['name' => $name, 'type' => $type, 'is_active' => true, 'tenant_id' => $tenant->id]);
                }

                $user->assignRole('admin');

                app(BillingService::class)->applyTrial($tenant);

                if (! $existingUser) {
                    DB::afterCommit(fn () => $user->sendEmailVerificationNotification());
                }
            });

            if ($isGoogleRegistered) {
                return redirect('/login');
            }

            Auth::guard('web')->login($user);

            $tenantUser = TenantUser::where('user_id', $user->id)
                ->where('role', 'owner')
                ->first();

            if ($tenantUser) {
                session(['tenant_id' => $tenantUser->tenant_id]);
            }

            $request->session()->save();

            $message = 'Kode verifikasi telah dikirim ke email kamu.';

            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'success',
                    'message' => $message,
                    'redirect' => '/email/verify',
                ]);
            }

            return redirect('/email/verify')->with('status', $message);
        } catch (ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json(['errors' => $e->errors()], 422);
            }

            return back()->withErrors($e->errors());
        } catch (\Throwable $e) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Terjadi kesalahan: '.$e->getMessage()], 422);
            }

            return back()->withErrors(['form' => 'Terjadi kesalahan: '.$e->getMessage()]);
        }
    }
}
