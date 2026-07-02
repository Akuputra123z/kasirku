<?php

namespace App\Listeners;

use App\Events\SubscriptionExpired;
use Illuminate\Contracts\Queue\ShouldQueue;

class NotifySubscriptionExpiring implements ShouldQueue
{
    public function handle(SubscriptionExpired $event): void
    {
        // TODO: Send notification to tenant staff about expiring subscription
        logger('Subscription expiring soon', [
            'tenant_id' => $event->tenant->id,
            'name' => $event->tenant->name,
        ]);
    }
}
