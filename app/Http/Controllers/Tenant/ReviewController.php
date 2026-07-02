<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $reviews = Review::where('tenant_id', tenant_id())
            ->with(['user', 'order'])
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(fn (Review $r) => [
                'id' => $r->id,
                'order_number' => $r->order?->order_number,
                'customer_name' => $r->user?->name,
                'customer_avatar' => $r->user?->profile_photo_url,
                'rating' => $r->rating,
                'review' => $r->review,
                'created_at' => $r->created_at->format('d M Y'),
            ]);

        $stats = [
            'total' => Review::where('tenant_id', tenant_id())->count(),
            'avg_rating' => (float) Review::where('tenant_id', tenant_id())->avg('rating'),
            'count_5' => Review::where('tenant_id', tenant_id())->where('rating', 5)->count(),
            'count_4' => Review::where('tenant_id', tenant_id())->where('rating', 4)->count(),
            'count_3' => Review::where('tenant_id', tenant_id())->where('rating', 3)->count(),
            'count_2' => Review::where('tenant_id', tenant_id())->where('rating', 2)->count(),
            'count_1' => Review::where('tenant_id', tenant_id())->where('rating', 1)->count(),
        ];

        return Inertia::render('tenant/reviews/index', [
            'reviews' => $reviews,
            'stats' => $stats,
        ]);
    }
}
