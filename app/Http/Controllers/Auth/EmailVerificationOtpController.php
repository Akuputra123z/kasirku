<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class EmailVerificationOtpController extends Controller
{
    public function verify(Request $request): RedirectResponse|JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        if (! $user) {
            return Redirect::back()->withErrors(['error' => 'Silakan login terlebih dahulu.']);
        }

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(config('fortify.home'));
        }

        if (
            ! $user->email_verification_code ||
            $user->email_verification_code !== $request->code ||
            ! $user->email_verification_code_expires_at ||
            $user->email_verification_code_expires_at->isPast()
        ) {
            return Redirect::back()->withErrors(['code' => 'Kode verifikasi tidak valid atau sudah kadaluarsa. Silakan minta kode baru.']);
        }

        $user->forceFill([
            'email_verified_at' => now(),
            'email_verification_code' => null,
            'email_verification_code_expires_at' => null,
        ])->save();

        return redirect()->intended(config('fortify.home'));
    }
}
