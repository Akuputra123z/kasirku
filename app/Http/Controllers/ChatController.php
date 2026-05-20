<?php

namespace App\Http\Controllers;

use App\Ai\Agents\ChatAgent;
use Exception;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Laravel\Ai\Exceptions\RateLimitedException;

class ChatController extends Controller
{
    public function index()
    {
        return Inertia::render('chat/index');
    }

    public function send(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|string',
        ]);

        try {
            $response = $this->executeWithRetry(function () use ($request) {
                $agent = new ChatAgent;

                if ($request->filled('conversation_id')) {
                    $agent = $agent->continue($request->conversation_id, as: Auth::user());
                } else {
                    $agent = $agent->forUser(Auth::user());
                }

                return $agent->prompt($request->message);
            });

            return response()->json([
                'status' => 'success',
                'message' => (string) $response,
                'conversation_id' => $response->conversationId,
            ]);
        } catch (RequestException $e) {
            $body = $e->response->body();
            $status = $e->response->status();

            Log::error('Chat API error: '.$e->getMessage(), [
                'user_id' => Auth::id(),
                'message' => $request->message,
                'status' => $status,
                'body' => $body,
            ]);

            $userMessage = match (true) {
                $status === 429 || str_contains($body, 'rate limit') || str_contains($body, 'quota') => 'Terlalu banyak permintaan. Mohon tunggu beberapa saat, lalu klik "Chat Baru" untuk memulai percakapan baru.',
                str_contains($body, 'overloaded') => 'Layanan AI sedang sibuk. Silakan coba lagi dalam beberapa saat.',
                str_contains($body, 'tool call validation') => 'Maaf, terjadi kesalahan teknis. Silakan klik "Chat Baru" dan coba lagi.',
                default => 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
            };

            return response()->json([
                'status' => 'error',
                'message' => $userMessage,
            ], 500);
        } catch (RateLimitedException $e) {
            Log::error('Chat rate limited: '.$e->getMessage(), [
                'user_id' => Auth::id(),
                'message' => $request->message,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terlalu banyak permintaan. Mohon tunggu beberapa saat, lalu klik "Chat Baru" untuk memulai percakapan baru.',
            ], 429);
        } catch (Exception $e) {
            $message = $e->getMessage();
            $isOverloaded = str_contains($message, 'overloaded');
            $isRateLimit = str_contains($message, 'rate limited') || str_contains($message, 'rate limit');
            $isToolError = str_contains($message, 'tool call validation');

            Log::error('Chat error: '.$message, [
                'user_id' => Auth::id(),
                'message' => $request->message,
            ]);

            $userMessage = match (true) {
                $isOverloaded => 'Layanan AI sedang sibuk. Silakan coba lagi dalam beberapa saat.',
                $isRateLimit => 'Terlalu banyak permintaan. Mohon tunggu beberapa saat, lalu klik "Chat Baru" untuk memulai percakapan baru.',
                $isToolError => 'Maaf, terjadi kesalahan teknis. Silakan klik "Chat Baru" dan coba lagi.',
                default => 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
            };

            return response()->json([
                'status' => 'error',
                'message' => $userMessage,
            ], 500);
        }
    }

    public function stream(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|string',
        ]);

        try {
            $agent = new ChatAgent;

            if ($request->filled('conversation_id')) {
                $agent = $agent->continue($request->conversation_id, as: Auth::user());
            } else {
                $agent = $agent->forUser(Auth::user());
            }

            return $agent->stream($request->message);
        } catch (RequestException $e) {
            Log::error('Chat stream error: '.$e->getMessage(), [
                'user_id' => Auth::id(),
                'message' => $request->message,
                'status' => $e->response->status(),
                'body' => $e->response->body(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Maaf, terjadi kesalahan. Silakan coba lagi.',
            ], 500);
        } catch (Exception $e) {
            Log::error('Chat stream error: '.$e->getMessage(), [
                'user_id' => Auth::id(),
                'message' => $request->message,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Maaf, terjadi kesalahan. Silakan coba lagi.',
            ], 500);
        }
    }

    private function executeWithRetry(callable $callback, int $maxRetries = 2): mixed
    {
        $attempt = 0;

        while (true) {
            try {
                return $callback();
            } catch (RateLimitedException $e) {
                throw $e;
            } catch (RequestException $e) {
                $attempt++;

                $body = $e->response->body();
                $isRetryable = str_contains($body, 'overloaded') || $e->response->status() === 429 || str_contains($body, 'rate limit') || str_contains($body, 'quota');

                if ($attempt >= $maxRetries || ! $isRetryable) {
                    throw $e;
                }

                Log::warning('Retrying AI request after error', [
                    'attempt' => $attempt,
                    'error' => $e->getMessage(),
                ]);

                sleep($attempt * 2);
            } catch (Exception $e) {
                $attempt++;

                $message = $e->getMessage();
                $isRetryable = str_contains($message, 'overloaded') || str_contains($message, 'rate limit') || str_contains($message, 'quota');

                if ($attempt >= $maxRetries || ! $isRetryable) {
                    throw $e;
                }

                Log::warning('Retrying AI request after error', [
                    'attempt' => $attempt,
                    'error' => $e->getMessage(),
                ]);

                sleep($attempt * 2);
            }
        }
    }
}
