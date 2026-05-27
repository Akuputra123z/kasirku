<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailOtpVerification extends Notification
{
    use Queueable;

    public function __construct(
        public string $code,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Kode Verifikasi Email - Kasirku')
            ->greeting('Halo '.$notifiable->name.'!')
            ->line('Berikut adalah kode verifikasi email kamu:')
            ->line('**'.$this->code.'**')
            ->line('Kode ini berlaku selama 10 menit.')
            ->line('Jika kamu tidak mendaftar di aplikasi kami, abaikan email ini.');
    }
}
