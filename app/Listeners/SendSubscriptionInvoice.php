<?php

namespace App\Listeners;

use App\Events\SubscriptionPaid;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendSubscriptionInvoice implements ShouldQueue
{
    public function handle(SubscriptionPaid $event): void
    {
        // TODO: Generate PDF invoice + send email
        // For MVP, just log it
        logger('Subscription paid - invoice pending', [
            'tenant_id' => $event->subscription->tenant_id,
            'order_id' => $event->subscription->midtrans_order_id,
            'amount' => $event->subscription->amount,
        ]);
    }
}
