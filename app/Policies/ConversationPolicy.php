<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\TenantUser;
use App\Models\User;

class ConversationPolicy
{
    public function view(User $user, Conversation $conversation): bool
    {
        if ($conversation->user_id === $user->id) {
            return true;
        }

        return TenantUser::where('user_id', $user->id)
            ->where('tenant_id', $conversation->tenant_id)
            ->where('is_active', true)
            ->exists();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function sendMessage(User $user, Conversation $conversation): bool
    {
        if ($conversation->user_id === $user->id) {
            return true;
        }

        return TenantUser::where('user_id', $user->id)
            ->where('tenant_id', $conversation->tenant_id)
            ->where('is_active', true)
            ->exists();
    }
}
