<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewOrder extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
        public string $event = 'created',
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'total' => $this->order->total,
            'customer_name' => $this->order->user?->name ?? 'Pengguna',
            'event' => $this->event,
            'store_name' => $this->order->tenant?->name,
            'message' => match ($this->event) {
                'created' => "Pesanan baru: {$this->order->order_number}",
                'paid' => "Pembayaran diterima: {$this->order->order_number}",
                'confirmed' => "Pesanan dikonfirmasi: {$this->order->order_number}",
                'shipped' => "Pesanan dikirim: {$this->order->order_number}",
                'completed' => "Pesanan selesai: {$this->order->order_number}",
                'cancelled' => "Pesanan dibatalkan: {$this->order->order_number}",
                default => "Status pesanan berubah: {$this->order->order_number}",
            },
        ];
    }
}
