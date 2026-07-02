<?php

namespace App\Models;

use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory, LogsActivity, SoftDeletes;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'phone'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'address',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function stores(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'store_customer')
            ->withPivot(['loyalty_points', 'total_spent', 'last_visit_at', 'notes'])
            ->withTimestamps();
    }

    public function storeCustomer()
    {
        return $this->hasMany(StoreCustomer::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function vouchers(): BelongsToMany
    {
        return $this->belongsToMany(Voucher::class, 'customer_voucher')
            ->withPivot(['used_at', 'transaction_id'])
            ->withTimestamps();
    }

    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(CustomerBankAccount::class);
    }
}
