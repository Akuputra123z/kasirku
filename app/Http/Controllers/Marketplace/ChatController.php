<?php

namespace App\Http\Controllers\Marketplace;

use App\Events\NewMessage;
use App\Events\NewNotification;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Notifications\NewChatMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        $conversations = Conversation::where('user_id', Auth::id())
            ->with(['tenant:id,slug,name,logo', 'latestMessage'])
            ->orderBy('last_message_at', 'desc')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Conversation $c) => [
                'id' => $c->id,
                'slug' => $c->slug,
                'tenant_id' => $c->tenant_id,
                'store_name' => $c->tenant->name,
                'store_slug' => $c->tenant->slug,
                'store_logo' => $c->tenant->logo,
                'subject' => $c->subject,
                'last_message' => $c->latestMessage?->body,
                'last_message_at' => $c->latestMessage?->created_at?->diffForHumans(),
                'unread_count' => $c->unreadCountFor(Auth::id()),
            ]);

        $activeConversation = null;
        $messages = null;

        if ($request->query('conversation')) {
            $conversation = Conversation::with('tenant:id,slug,name,logo')
                ->where('slug', $request->query('conversation'))
                ->first();

            if ($conversation && Gate::allows('view', $conversation)) {
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

                $activeConversation = [
                    'id' => $conversation->id,
                    'slug' => $conversation->slug,
                    'tenant_id' => $conversation->tenant_id,
                    'store_name' => $conversation->tenant->name,
                    'store_slug' => $conversation->tenant->slug,
                    'store_logo' => $conversation->tenant->logo,
                ];
            }
        }

        return Inertia::render('marketplace/chat/index', [
            'conversations' => $conversations,
            'activeConversation' => $activeConversation,
            'messages' => $messages,
        ]);
    }

    public function show(Conversation $conversation): Response
    {
        Gate::authorize('view', $conversation);

        $conversation->load(['tenant:id,slug,name,logo']);

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

        return Inertia::render('marketplace/chat/show', [
            'conversation' => [
                'id' => $conversation->id,
                'slug' => $conversation->slug,
                'tenant_id' => $conversation->tenant_id,
                'store_name' => $conversation->tenant->name,
                'store_slug' => $conversation->tenant->slug,
            ],
            'messages' => $messages,
        ]);
    }

    public function start(Request $request, Tenant $tenant): RedirectResponse
    {
        $conversation = Conversation::firstOrCreate(
            ['user_id' => Auth::id(), 'tenant_id' => $tenant->id],
            ['subject' => $request->input('subject')],
        );

        if ($request->input('message')) {
            $message = $conversation->messages()->create([
                'sender_id' => Auth::id(),
                'sender_type' => 'customer',
                'body' => $request->input('message'),
            ]);

            $conversation->update(['last_message_at' => now()]);

            broadcast(new NewMessage($message));

            $staffUserIds = TenantUser::where('tenant_id', $conversation->tenant_id)
                ->where('is_active', true)
                ->pluck('user_id');
            $staffUsers = User::whereIn('id', $staffUserIds)->get();

            foreach ($staffUsers as $staff) {
                $staff->notify(new NewChatMessage($message));
                try {
                    NewNotification::dispatch(
                        $staff->id,
                        [
                            'id' => (string) $staff->notifications()->latest()->first()?->id,
                            'type' => 'NewChatMessage',
                            'data' => [
                                'conversation_id' => $conversation->id,
                                'sender_name' => Auth::user()->name,
                                'body' => Str::limit($request->input('message'), 100),
                            ],
                            'created_at' => 'Baru saja',
                        ],
                        $staff->unreadNotifications()->count(),
                    );
                } catch (\Throwable $e) {
                    // Broadcast gagal (Reverb tidak jalan), tidak perlu gagalkan request
                }
            }
        }

        return redirect()->route('marketplace.chat.index', ['conversation' => $conversation->slug]);
    }

    public function sendMessage(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('sendMessage', $conversation);

        $data = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $message = $conversation->messages()->create([
            'sender_id' => Auth::id(),
            'sender_type' => 'customer',
            'body' => $data['body'],
        ]);

        $conversation->update(['last_message_at' => now()]);

        broadcast(new NewMessage($message));

        $staffUserIds = TenantUser::where('tenant_id', $conversation->tenant_id)
            ->where('is_active', true)
            ->pluck('user_id');
        $staffUsers = User::whereIn('id', $staffUserIds)->get();

        foreach ($staffUsers as $staff) {
            $staff->notify(new NewChatMessage($message));
        }

        foreach ($staffUsers as $staff) {
            try {
                NewNotification::dispatch(
                    $staff->id,
                    [
                        'id' => (string) $staff->notifications()->latest()->first()?->id,
                        'type' => 'NewChatMessage',
                        'data' => [
                            'conversation_id' => $conversation->id,
                            'sender_name' => Auth::user()->name,
                            'body' => Str::limit($data['body'], 100),
                        ],
                        'created_at' => 'Baru saja',
                    ],
                    $staff->unreadNotifications()->count(),
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
}
