<?php

namespace App\Http\Controllers\Tenant;

use App\Events\NewMessage;
use App\Events\NewNotification;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewChatMessage;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function __construct()
    {
        Carbon::setLocale('id');
    }

    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $filter = $request->get('filter');

        $conversations = Conversation::where('conversations.tenant_id', tenant_id())
            ->leftJoin('users', 'users.id', '=', 'conversations.user_id')
            ->select('conversations.*', 'users.name as customer_name', 'users.email as customer_email')
            ->with(['latestMessage'])
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('conversations.subject', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%");
            }))
            ->when($filter === 'unread', function ($q) {
                $q->whereExists(function ($sub) {
                    $sub->selectRaw('1')
                        ->from('messages')
                        ->whereColumn('messages.conversation_id', 'conversations.id')
                        ->where('sender_type', 'customer')
                        ->whereNull('read_at');
                });
            })
            ->when($filter === 'read', function ($q) {
                $q->whereNotExists(function ($sub) {
                    $sub->selectRaw('1')
                        ->from('messages')
                        ->whereColumn('messages.conversation_id', 'conversations.id')
                        ->where('sender_type', 'customer')
                        ->whereNull('read_at');
                });
            })
            ->orderBy('last_message_at', 'desc')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Conversation $c) => [
                'id' => $c->id,
                'slug' => $c->slug,
                'customer_id' => $c->user_id,
                'customer_name' => $c->customer_name ?? explode('@', $c->customer_email ?? '')[0] ?? "User #{$c->user_id}",
                'customer_email' => $c->customer_email,
                'subject' => $c->subject,
                'last_message' => $c->latestMessage?->body,
                'last_message_at' => $c->latestMessage?->created_at?->diffForHumans(),
                'unread_count' => $c->unreadCountFor(Auth::id()),
            ]);

        return Inertia::render('tenant/chat/index', [
            'conversations' => $conversations,
            'filters' => [
                'search' => $search,
                'filter' => $filter,
            ],
        ]);
    }

    public function show(Conversation $conversation): Response
    {
        Gate::authorize('view', $conversation);

        $conversation->messages()
            ->where('sender_id', '!=', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->orderBy('created_at', 'asc')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (Message $m) => [
                'id' => $m->id,
                'sender_id' => $m->sender_id,
                'sender_type' => $m->sender_type,
                'sender_name' => $m->sender?->name ?? 'Pengguna tidak dikenal',
                'body' => $m->body,
                'created_at' => $m->created_at->toISOString(),
                'is_mine' => $m->sender_id === Auth::id(),
            ]);

        $customer = User::where('id', $conversation->user_id)->first(['name', 'email']);

        return Inertia::render('tenant/chat/show', [
            'conversation' => [
                'id' => $conversation->id,
                'slug' => $conversation->slug,
                'customer_id' => $conversation->user_id,
                'customer_name' => $customer?->name ?? explode('@', $customer?->email ?? '')[0] ?? "User #{$conversation->user_id}",
            ],
            'messages' => $messages,
        ]);
    }

    public function sendMessage(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('sendMessage', $conversation);

        $data = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $message = $conversation->messages()->create([
            'sender_id' => Auth::id(),
            'sender_type' => 'staff',
            'body' => $data['body'],
        ]);

        $conversation->update(['last_message_at' => now()]);

        broadcast(new NewMessage($message));

        $customer = User::find($conversation->user_id);
        if ($customer) {
            $customer->notify(new NewChatMessage($message));
            try {
                NewNotification::dispatch(
                    $customer->id,
                    [
                        'id' => (string) $customer->notifications()->latest()->first()?->id,
                        'type' => 'NewChatMessage',
                        'data' => [
                            'conversation_id' => $conversation->id,
                            'sender_name' => Auth::user()->name,
                            'body' => Str::limit($data['body'], 100),
                        ],
                        'created_at' => 'Baru saja',
                    ],
                    $customer->unreadNotifications()->count(),
                );
            } catch (\Throwable $e) {
                // Broadcast gagal (Reverb tidak jalan), tidak perlu gagalkan request
            }
        }

        return response()->json([
            'id' => $message->id,
            'body' => $message->body,
            'sender_type' => $message->sender_type,
            'created_at' => $message->created_at->toISOString(),
        ]);
    }

    public function poll(Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $conversation);

        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn (Message $m) => [
                'id' => $m->id,
                'sender_id' => $m->sender_id,
                'sender_type' => $m->sender_type,
                'sender_name' => $m->sender?->name ?? 'Pengguna tidak dikenal',
                'body' => $m->body,
                'created_at' => $m->created_at->toISOString(),
                'is_mine' => $m->sender_id === Auth::id(),
            ]);

        return response()->json(['messages' => $messages]);
    }
}
