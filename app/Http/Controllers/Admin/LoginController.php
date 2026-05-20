<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('admin/login');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Email atau password salah.',
            ]);
        }

        if (! $user->can('manage-tenants')) {
            throw ValidationException::withMessages([
                'email' => 'Anda tidak memiliki akses ke panel admin.',
            ]);
        }

        if ($user->hasEnabledTwoFactorAuthentication()) {
            $request->session()->put('login.id', $user->getKey());

            return redirect('/two-factor-challenge');
        }

        auth()->login($user, $request->boolean('remember'));

        $request->session()->regenerate();

        return redirect()->intended('/admin/tenants');
    }
}
