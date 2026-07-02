<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreCustomer extends Model
{
    protected $table = 'store_customer';

    protected $fillable = [
        'customer_id',
        'tenant_id',
        'loyalty_points',
        'total_spent',
        'last_visit_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'loyalty_points' => 'integer',
            'total_spent' => 'float',
            'last_visit_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
