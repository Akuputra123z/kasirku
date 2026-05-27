<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'po_number',
        'supplier_id',
        'user_id',
        'order_date',
        'received_date',
        'total_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'order_date' => 'date',
        'received_date' => 'date',
        'total_amount' => 'float',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(PurchaseOrderDetail::class);
    }
}
