<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class NewNotification implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public string $userId,
        public array $notification,
        public int $unreadCount,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('App.Models.User.'.$this->userId);
    }

    public function broadcastAs(): string
    {
        return 'NewNotification';
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => $this->notification,
            'unreadCount' => $this->unreadCount,
        ];
    }
}
