<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class NewChatMessage extends Notification
{
    use Queueable;

    public function __construct(
        public Message $message,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'conversation_id' => $this->message->conversation_id,
            'message_id' => $this->message->id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $this->message->sender?->name ?? 'Pengguna',
            'body' => Str::limit($this->message->body, 100),
        ];
    }
}
