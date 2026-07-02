<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Conversation extends Model
{
    protected $fillable = [
        'user_id',
        'tenant_id',
        'subject',
        'last_message_at',
        'slug',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $conversation) {
            if (! $conversation->slug) {
                $user = User::find($conversation->user_id);
                $name = $user?->name ?? "user-{$conversation->user_id}";
                $baseSlug = Str::slug($name);
                $slug = $baseSlug;
                $counter = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = $baseSlug.'-'.$counter++;
                }
                $conversation->slug = $slug;
            }
        });
    }

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->latest('created_at');
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany('created_at');
    }

    public function unreadMessages(): HasMany
    {
        return $this->hasMany(Message::class)->whereNull('read_at');
    }

    public function unreadCountFor(?int $userId = null): int
    {
        if (! $userId) {
            return 0;
        }

        return $this->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $userId)
            ->count();
    }
}
