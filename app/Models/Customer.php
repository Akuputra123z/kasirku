<?php

namespace App\Models;

use App\Traits\HasTenant;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory, HasTenant, LogsActivity, SoftDeletes;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'phone', 'loyalty_points'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'phone',
        'address',
        'loyalty_points',
    ];

    protected $casts = [
        'loyalty_points' => 'integer',
    ];

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
}
