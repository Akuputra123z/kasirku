<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    /**
     * Kolom yang dapat diisi secara massal.
     */
    protected $fillable = [
        'tenant_id',
        'sku',
        'barcode',
        'name',
        'description',
        'price',
        'stock',
        'category_id',
        'image',
        'status',
    ];

    /**
     * Casting tipe data agar konsisten saat dikirim ke Frontend (Inertia/React).
     */
    protected $appends = ['image_url'];

    protected $casts = [
        'price' => 'float',
        'stock' => 'integer',
    ];

    /**
     * Relasi ke kategori produk.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Relasi ke varian produk (misal: ukuran Regular, Large).
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Relasi ke tambahan produk (misal: extra topping, extra shot).
     */
    public function extras(): HasMany
    {
        return $this->hasMany(ProductExtra::class);
    }

    /**
     * Relasi ke detail transaksi untuk pengecekan riwayat sebelum penghapusan.
     */
    public function transactionDetails(): HasMany
    {
        return $this->hasMany(TransactionDetail::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        return Storage::disk('public')->url($this->image);
    }
}
