<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\PaymentMethod;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RegisterStoreController extends Controller
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __invoke(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'store_name' => ['required', 'string', 'max:255'],
            'store_slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:tenants,slug'],
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $tenant = Tenant::create([
            'name' => $validated['store_name'],
            'slug' => $validated['store_slug'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
            'tenant_id' => $tenant->id,
        ]);

        (new RoleAndPermissionSeeder)->run($tenant->id);

        foreach ([
            ['Cash', 'Cash'], ['QRIS', 'E-Wallet'], ['GoPay', 'E-Wallet'],
            ['ShopeePay', 'E-Wallet'], ['BCA', 'Bank'], ['Mandiri', 'Bank'], ['BRI', 'Bank'],
        ] as [$name, $type]) {
            PaymentMethod::create(['name' => $name, 'type' => $type, 'is_active' => true, 'tenant_id' => $tenant->id]);
        }

        $user->assignRole('admin');

        $slug = $validated['store_slug'];
        $host = request()->getHost();
        $port = in_array(request()->getPort(), [80, 443]) ? '' : ':'.request()->getPort();
        $isLocalIp = in_array($host, ['127.0.0.1', 'localhost'], true);

        if ($isLocalIp) {
            return response()->json([
                'status' => 'success',
                'message' => 'Toko berhasil dibuat! Silakan login.',
                'redirect' => '/login?tenant='.$slug,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Toko berhasil dibuat! Silakan login.',
            'redirect' => '//'.$slug.'.'.$host.$port.'/login',
        ]);
    }
}
