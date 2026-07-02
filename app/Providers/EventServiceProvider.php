<?php

namespace App\Providers;

use App\Events\SubscriptionExpired;
use App\Events\SubscriptionPaid;
use App\Listeners\NotifySubscriptionExpiring;
use App\Listeners\SendSubscriptionInvoice;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        SubscriptionPaid::class => [
            SendSubscriptionInvoice::class,
        ],
        SubscriptionExpired::class => [
            NotifySubscriptionExpiring::class,
        ],
    ];

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
