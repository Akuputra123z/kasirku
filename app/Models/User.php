<?php

namespace App\Models;

use App\Notifications\EmailOtpVerification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Activitylog\Models\Concerns\CausesActivity;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'email_verified_at', 'profile_photo_path'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use CausesActivity, HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    protected $appends = ['has_customer_account', 'has_store', 'profile_photo_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'email_verification_code_expires_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function sendEmailVerificationNotification(): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $this->forceFill([
            'email_verification_code' => $code,
            'email_verification_code_expires_at' => now()->addMinutes(10),
        ])->save();

        $this->notify(new EmailOtpVerification($code));
    }

    public function tenantUsers(): HasMany
    {
        return $this->hasMany(TenantUser::class);
    }

    public function activeTenantUser(): HasOne
    {
        return $this->hasOne(TenantUser::class)->where('is_active', true);
    }

    public function customer(): HasOne
    {
        return $this->hasOne(Customer::class);
    }

    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function isOwner(): bool
    {
        return $this->tenantUsers()->where('role', 'owner')->exists();
    }

    public function isStaff(): bool
    {
        return $this->tenantUsers()->where('role', 'staff')->exists();
    }

    public function getHasCustomerAccountAttribute(): bool
    {
        return $this->customer()->exists();
    }

    public function getHasStoreAttribute(): bool
    {
        return $this->tenantUsers()->exists();
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        return $this->profile_photo_path
            ? Storage::url($this->profile_photo_path)
            : null;
    }
}
