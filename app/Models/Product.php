<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Product extends Model
{
    use HasFactory, HasTenant, LogsActivity, SoftDeletes;

    protected static function booted(): void
    {
        static::deleting(function ($product) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
        });

        static::forceDeleting(function ($product) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
        });

        static::creating(function ($product) {
            if (! $product->slug) {
                $product->slug = static::generateUniqueSlug($product->name, $product->tenant_id);
            }
        });
    }

    public static function generateUniqueSlug(string $name, ?int $tenantId): string
    {
        $slug = Str::slug($name);
        $original = $slug;
        $i = 1;
        while (static::where('tenant_id', $tenantId)->where('slug', $slug)->exists()) {
            $slug = $original.'-'.$i++;
        }

        return $slug;
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'price', 'stock', 'cost_price', 'status'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    /**
     * Kolom yang dapat diisi secara massal.
     */
    protected $fillable = [
        'tenant_id',
        'sku',
        'barcode',
        'name',
        'slug',
        'description',
        'price',
        'cost_price',
        'stock',
        'category_id',
        'brand_id',
        'image',
        'status',
        'visible_online',
        'online_price',
        'stock_online',
        'weight',
    ];

    protected $appends = ['image_url', 'display_price', 'available_stock'];

    protected $casts = [
        'price' => 'float',
        'cost_price' => 'float',
        'stock' => 'integer',
        'visible_online' => 'boolean',
        'online_price' => 'float',
        'stock_online' => 'integer',
        'weight' => 'integer',
    ];

    public function getDisplayPriceAttribute(): float
    {
        return $this->online_price ?? $this->price ?? 0;
    }

    public function getAvailableStockAttribute(): int
    {
        return $this->stock_online ?? $this->stock;
    }

    /**
     * Relasi ke kategori produk.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
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

    public function scopeVisibleOnline($query)
    {
        return $query->where('visible_online', true)->where('status', 'active');
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        return '/storage/'.$this->image;
    }
}
