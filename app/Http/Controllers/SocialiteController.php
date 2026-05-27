<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SocialiteController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')
            ->redirectUrl(route('auth.google.callback'))
            ->redirect();
    }

    public function registerRedirect()
    {
        session()->put('google_action', 'register');

        return Socialite::driver('google')
            ->redirectUrl(route('auth.google.callback'))
            ->redirect();
    }

    public function callback()
    {
        $isRegistration = session()->pull('google_action') === 'register';

        $googleUser = Socialite::driver('google')
            ->redirectUrl(route('auth.google.callback'))
            ->stateless()
            ->user();

        if ($isRegistration) {
            session()->put('google_register', [
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'avatar' => $googleUser->avatar,
            ]);

            return redirect('/register');
        }

        $user = User::where('email', $googleUser->email)->first();

        if (! $user) {
            return redirect('/register')->withErrors(['email' => 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.']);
        }

        Auth::login($user);

        return redirect()->intended(config('fortify.home'));
    }
}
