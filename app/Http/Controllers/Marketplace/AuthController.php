<?php

namespace App\Http\Controllers\Marketplace;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showRegister(Request $request)
    {
        return Inertia::render('marketplace/register', [
            'redirect' => $request->query('redirect'),
        ]);
    }

    public function showLogin(Request $request)
    {
        return Inertia::render('marketplace/login', [
            'status' => session('status'),
            'redirect' => $request->query('redirect'),
        ]);
    }

    public function register(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'redirect' => ['nullable', 'string'],
        ])->validate();

        $existingUser = User::where('email', $validated['email'])->first();

        if ($existingUser) {
            $customer = Customer::where('user_id', $existingUser->id)->first();

            if ($customer) {
                Auth::login($existingUser);

                if (! empty($validated['redirect'])) {
                    return redirect($validated['redirect']);
                }

                return redirect('/customer/dashboard');
            }

            $redirect = $validated['redirect'] ?? null;

            return redirect('/customer/login')
                ->with('status', 'Email sudah terdaftar. Silakan masuk.')
                ->with('redirect', $redirect);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        Customer::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ]);

        $redirect = $validated['redirect'] ?? null;

        return redirect('/customer/login')
            ->with('status', 'Pendaftaran berhasil. Silakan masuk.')
            ->with('redirect', $redirect);
    }

    public function login(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'redirect' => ['nullable', 'string'],
        ])->validate();

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $customer = Customer::where('user_id', $user->id)->first();

        if (! $customer) {
            throw ValidationException::withMessages([
                'email' => ['Akun marketplace tidak ditemukan.'],
            ]);
        }

        Auth::login($user);

        if (! empty($validated['redirect'])) {
            return redirect($validated['redirect']);
        }

        return redirect('/customer/dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function showForgotPassword()
    {
        return Inertia::render('marketplace/forgot-password', [
            'status' => session('status'),
        ]);
    }

    public function sendResetLink(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'email' => ['required', 'email'],
        ])->validate();

        $status = Password::sendResetLink(
            $validated
        );

        if ($status === Password::RESET_LINK_SENT) {
            return redirect()->back()->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }

    public function showResetPassword(Request $request, string $token)
    {
        return Inertia::render('marketplace/reset-password', [
            'token' => $token,
            'email' => $request->email,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ])->validate();

        $status = Password::reset(
            $validated,
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->to('/customer/login')->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }
}
