<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $notifications = Auth::user()->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($notifications);
    }

    public function unread(): JsonResponse
    {
        $user = Auth::user();
        $unreadCount = $user->unreadNotifications()->count();
        $notifications = $user->unreadNotifications()
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'type' => class_basename($n->type),
                'data' => $n->data,
                'read_at' => $n->read_at,
                'created_at' => $n->created_at->diffForHumans(),
            ]);

        return response()->json([
            'unreadCount' => $unreadCount,
            'notifications' => $notifications,
        ]);
    }

    public function read(DatabaseNotification $notification): JsonResponse
    {
        if ($notification->notifiable_id !== Auth::id()) {
            abort(403);
        }

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    public function readAll(): JsonResponse
    {
        Auth::user()->unreadNotifications->markAsRead();

        return response()->json(['success' => true]);
    }
}
