<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class NewMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public Message $message,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('conversation.'.$this->message->conversation_id);
    }

    public function broadcastAs(): string
    {
        return 'NewMessage';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'sender_type' => $this->message->sender_type,
            'body' => $this->message->body,
            'sender_name' => $this->message->sender?->name ?? 'Pengguna tidak dikenal',
            'created_at' => $this->message->created_at->toISOString(),
        ];
    }
}
